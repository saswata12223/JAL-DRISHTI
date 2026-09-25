import os
import json
import pandas as pd
from shapely.geometry import Point
from shapely import from_wkb
import shapely.ops
import pyogrio
import pyproj
from shapely.strtree import STRtree
import logging
import math
import numpy as np
from typing import Dict, Any

os.makedirs('data/processed/events', exist_ok=True)
os.makedirs('docs/audit', exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Phase11")

# Haversine distance
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

class AdminLayerCache:
    def __init__(self, tree, geometries, fields):
        self.tree = tree
        self.geometries = geometries
        self.fields = fields

def load_admin_layer(layer_name, path):
    meta, fids, geom_wkb, field_data = pyogrio.raw.read(path)
    geoms = from_wkb(geom_wkb)
    source_crs = meta['crs']
    transformer = pyproj.Transformer.from_crs(source_crs, "EPSG:4326", always_xy=True)
    projected_geoms = [shapely.ops.transform(transformer.transform, g) for g in geoms]
    field_dict = {fname: field_data[idx] for idx, fname in enumerate(meta['fields'])}
    tree = STRtree(projected_geoms)
    return AdminLayerCache(tree=tree, geometries=projected_geoms, fields=field_dict)

def resolve_layer(cache, point, name_field):
    indices = cache.tree.query(point, predicate='intersects')
    if len(indices) == 0: return None
    return cache.fields[name_field][indices[0]]

def perform_spatial_matching(events_df):
    state_cache = load_admin_layer('state', 'data/processed/gis/soi/state/State Boundary.shp')
    dist_cache = load_admin_layer('district', 'data/processed/gis/soi/district/District Boundary.shp')
    sub_cache = load_admin_layer('subdistrict', 'data/processed/gis/soi/subdistrict/Sub_district Boundary.shp')
    
    results = []
    for idx, row in events_df.iterrows():
        lat = row.get('latitude')
        lon = row.get('longitude')
        status = 'INSUFFICIENT_EVIDENCE'
        soi_state, soi_district, soi_subdistrict = None, None, None
        
        if pd.notna(lat) and pd.notna(lon) and not math.isnan(lat):
            pt = Point(lon, lat)
            soi_state = resolve_layer(state_cache, pt, 'STATE') or resolve_layer(state_cache, pt, 'STATE_UT')
            if soi_state:
                status = 'VERIFIED_MATCH'
                soi_district = resolve_layer(dist_cache, pt, 'DISTRICT')
                soi_subdistrict = resolve_layer(sub_cache, pt, 'SUB_DIST')
            else:
                status = 'SPATIAL_CONFLICT'
        elif pd.notna(row.get('district')):
            status = 'DISTRICT_ONLY'
            
        results.append({
            'soi_state': soi_state,
            'soi_district': soi_district,
            'soi_subdistrict': soi_subdistrict,
            'admin_match_status': status
        })
    return results

def calculate_feature_evidence(row: pd.Series, gpm_df: pd.DataFrame) -> Dict[str, Any]:
    lat = row.get('latitude')
    lon = row.get('longitude')
    ev_date = row.get('event_date')
    ev_end = row.get('event_end_date')
    
    feat_lat, feat_lon = None, None
    spat_dist = None
    spat_status = 'INSUFFICIENT_EVIDENCE'
    temp_status = 'INSUFFICIENT_EVIDENCE'
    feat_status = 'INSUFFICIENT_EVIDENCE'
    reason = ""
    feat_start = None
    feat_end = None
    
    has_coords = pd.notna(lat) and not math.isnan(lat)
    has_dates = pd.notna(ev_date)
    
    if not has_coords and not has_dates:
        reason = "No coordinates or dates available for matching."
        return {
            'feature_latitude': None, 'feature_longitude': None, 'spatial_distance_km': None,
            'spatial_match_status': spat_status, 'temporal_match_status': temp_status,
            'feature_match_status': feat_status, 'feature_first_timestamp': None,
            'feature_last_timestamp': None, 'reason': reason
        }
        
    if gpm_df is None or gpm_df.empty:
        return {
            'feature_latitude': None, 'feature_longitude': None, 'spatial_distance_km': None,
            'spatial_match_status': 'INSUFFICIENT_EVIDENCE', 'temporal_match_status': 'INSUFFICIENT_EVIDENCE',
            'feature_match_status': 'INSUFFICIENT_EVIDENCE', 'feature_first_timestamp': None,
            'feature_last_timestamp': None, 'reason': "GPM feature dataset unavailable."
        }

    # 1. Spatial Search
    if has_coords:
        candidates = gpm_df[
            (gpm_df['latitude'] >= lat - 0.15) & (gpm_df['latitude'] <= lat + 0.15) &
            (gpm_df['longitude'] >= lon - 0.15) & (gpm_df['longitude'] <= lon + 0.15)
        ]
        if not candidates.empty:
            candidates = candidates.copy()
            candidates['dist'] = candidates.apply(lambda r: haversine(lat, lon, r['latitude'], r['longitude']), axis=1)
            closest = candidates.sort_values('dist').iloc[0]
            feat_lat = closest['latitude']
            feat_lon = closest['longitude']
            spat_dist = closest['dist']
            spat_status = 'VERIFIED_MATCH'
            reason += f"Nearest GPM grid cell found at {spat_dist:.2f} km distance. "
        else:
            spat_status = 'NO_MATCH'
            reason += "No GPM grid cells within 0.15 degrees candidate bounding box. "
    else:
        spat_status = 'INSUFFICIENT_EVIDENCE'
        reason += "No event coordinates. "

    # 2. Temporal Search (strictly limited to the matched cell)
    if has_dates:
        if spat_status == 'VERIFIED_MATCH':
            cell_data = gpm_df[(gpm_df['latitude'] == feat_lat) & (gpm_df['longitude'] == feat_lon)]
            
            ev_d1 = pd.to_datetime(ev_date)
            ev_d2 = pd.to_datetime(ev_end) if pd.notna(ev_end) else ev_d1
            
            # Check timestamps on the given calendar date(s)
            t_candidates = cell_data[
                (cell_data['timestamp'].dt.date >= ev_d1.date()) &
                (cell_data['timestamp'].dt.date <= ev_d2.date())
            ]
            if not t_candidates.empty:
                temp_status = 'VERIFIED_MATCH'
                feat_start = str(t_candidates['timestamp'].min())
                feat_end = str(t_candidates['timestamp'].max())
                reason += "GPM timestamps at exactly this spatial cell overlap with event date range (DATE_LEVEL_OVERLAP). "
            else:
                temp_status = 'NO_MATCH'
                reason += "No GPM observations found for event dates at this spatial cell. "
        else:
            # We can't do cell-specific temporal match if we don't have a cell
            temp_status = 'INSUFFICIENT_EVIDENCE'
            reason += "Cannot verify temporal overlap without a matched spatial cell. "
    else:
        temp_status = 'INSUFFICIENT_EVIDENCE'
        reason += "No event dates. "
        
    if spat_status == 'VERIFIED_MATCH' and temp_status == 'VERIFIED_MATCH':
        feat_status = 'VERIFIED_MATCH'
    elif spat_status == 'NO_MATCH' or temp_status == 'NO_MATCH':
        feat_status = 'NO_MATCH'
    elif spat_status == 'INSUFFICIENT_EVIDENCE' or temp_status == 'INSUFFICIENT_EVIDENCE':
        feat_status = 'INSUFFICIENT_EVIDENCE'
    else:
        feat_status = 'PARTIAL_MATCH'

    return {
        'feature_latitude': feat_lat,
        'feature_longitude': feat_lon,
        'spatial_distance_km': spat_dist,
        'spatial_match_status': spat_status,
        'temporal_match_status': temp_status,
        'feature_match_status': feat_status,
        'feature_first_timestamp': feat_start,
        'feature_last_timestamp': feat_end,
        'reason': reason.strip()
    }

def get_feature_evidence(events_df):
    results = []
    try:
        gpm_df = pd.read_csv('data/processed/rainfall/historical_gpm_event_rainfall.csv')
        gpm_df['timestamp'] = pd.to_datetime(gpm_df['timestamp'], utc=True)
    except Exception as e:
        gpm_df = None

    for idx, row in events_df.iterrows():
        res = calculate_feature_evidence(row, gpm_df)
        results.append(res)
    return results

def main():
    df = pd.read_csv('data/processed/standardized/standardized_historical_events.csv')
    
    admin_res = perform_spatial_matching(df)
    for i, a in enumerate(admin_res):
        for k, v in a.items(): df.at[i, k] = v
            
    feat_res = get_feature_evidence(df)
    for i, f in enumerate(feat_res):
        for k, v in f.items(): df.at[i, k] = v
        
    df['ground_truth_status'] = 'DOCUMENTED'
    
    canonical = []
    for idx, row in df.iterrows():
        source_id = row.get('event_id')  # Because event_id in this CSV is actually the source record identifier FL-UK-1970-01 etc.
        source_org = None
        if pd.notna(row.get('source_name')):
            if "NDMA" in row.get('source_name'): source_org = "NDMA"
            elif "GSI" in row.get('source_name'): source_org = "GSI"
            elif "IMD" in row.get('source_name'): source_org = "IMD"
            elif "CWC" in row.get('source_name'): source_org = "CWC"
            elif "WIHG" in row.get('source_name'): source_org = "WIHG"
            elif "SEOC" in row.get('source_name'): source_org = "SEOC"
            else: source_org = row.get('source_name').split('/')[0].strip()
        
        canonical.append({
            'event_id': row.get('event_id'),
            'source_id': source_id,
            'source_organization': source_org,
            'source_document': row.get('source_name'),
            'source_url': row.get('source_url') if pd.notna(row.get('source_url')) else None,
            'event_date': row.get('event_date'),
            'latitude': row.get('latitude') if pd.notna(row.get('latitude')) else None,
            'longitude': row.get('longitude') if pd.notna(row.get('longitude')) else None,
            'state': row.get('soi_state') or row.get('state'),
            'district': row.get('district'),
            'severity': row.get('severity_category'),
            'evidence_level': row.get('confidence'),
            'spatial_precision': 'EXACT' if pd.notna(row.get('latitude')) else 'DISTRICT',
            'temporal_precision': 'EXACT_DATE' if pd.notna(row.get('event_date')) else 'UNKNOWN'
        })
        
    with open('data/processed/events/canonical_historical_events.json', 'w') as f:
        json.dump(canonical, f, indent=2)
        
    ev_df = df[[
        'event_id', 'event_date', 'latitude', 'longitude', 'soi_state', 'district',
        'source_name', 'admin_match_status', 'spatial_match_status', 'temporal_match_status',
        'feature_match_status', 'feature_latitude', 'feature_longitude', 'spatial_distance_km',
        'feature_first_timestamp', 'feature_last_timestamp', 'reason'
    ]].copy()
    ev_df.to_csv('data/processed/events/phase11_event_evidence_table.csv', index=False)
    
    # Generate Markdown Report
    c_source = len(df)
    c_canon = len(canonical)
    c_dup = c_source - len(df['event_id'].unique())
    c_admin_res = len(df[df['admin_match_status'] == 'VERIFIED_MATCH'])
    c_spat = len(df[df['spatial_match_status'] == 'VERIFIED_MATCH'])
    c_spat_miss = len(df[df['spatial_match_status'] == 'INSUFFICIENT_EVIDENCE'])
    c_temp = len(df[df['temporal_match_status'] == 'VERIFIED_MATCH'])
    c_temp_miss = len(df[df['temporal_match_status'] == 'INSUFFICIENT_EVIDENCE'])
    c_feat_ver = len(df[df['feature_match_status'] == 'VERIFIED_MATCH'])
    c_feat_par = len(df[df['feature_match_status'] == 'PARTIAL_MATCH'])
    c_feat_no = len(df[df['feature_match_status'] == 'NO_MATCH'])
    c_feat_miss = len(df[df['feature_match_status'] == 'INSUFFICIENT_EVIDENCE'])
    
    report = f"""# PHASE 11 HISTORICAL EVENT EVIDENCE AUDIT

## Dataset Inventory

### historical_gpm_event_rainfall.csv
- **Path**: data/processed/rainfall/historical_gpm_event_rainfall.csv
- **Type**: PROCESSED / FEATURE-DERIVED
- **Source**: NASA GPM IMERG 3IMERGHH V07B (via HDF5 granules)
- **Lineage**: Extracted from GPM granules explicitly for the historical events as evidenced by historical_gpm_source_manifest.csv. It is not a raw global dataset, but an event-linked extract.
- **Spatial Resolution**: 0.1 degree grid
- **Temporal Resolution**: 30-minute intervals
- **Timestamps**: UTC
- **Usability**: USABLE for spatial and temporal bounding (as independent processed telemetry).

### historical_event_benchmark.json
- **Path**: data/processed/ml/models/historical_event_benchmark.json
- **Type**: DERIVED / MODEL OUTPUT
- **Reason**: Contains pre-calculated model metrics (predicted_probability_xgboost, scs_direct_runoff_q_mm). 
- **Usability**: REJECTED. Not suitable for raw feature matching.

## Canonical Event Statistics
- Source records: {c_source}
- Canonical records: {c_canon}
- Duplicates: {c_dup}

## Administrative Resolution (Survey of India)
- Spatially resolved to State/District polygons: {c_admin_res}
- District only (no coords): {len(df[df['admin_match_status'] == 'DISTRICT_ONLY'])}

## Feature Evidence Summary
- Spatial candidate method: ±0.15° latitude/longitude bounding box
- Spatial selection: nearest valid GPM grid centre
- Distance: Haversine distance in km
- Temporal method: actual timestamps at the selected GPM grid cell
- Event precision: preserved from source
- Feature verification: requires both spatial and temporal correspondence

### Counts
- Spatially Matched: {c_spat}
- Spatially Unmatched: {len(df[df['spatial_match_status'] == 'NO_MATCH'])}
- Spatially Insufficient: {c_spat_miss}
- Temporally Matched: {c_temp}
- Temporally Unmatched: {len(df[df['temporal_match_status'] == 'NO_MATCH'])}
- Temporally Insufficient: {c_temp_miss}
- Feature-matched (Verified): {c_feat_ver}
- Feature-matched (Partial): {c_feat_par}
- Feature Unmatched / Rejected: {c_feat_no}
- Feature Insufficient: {c_feat_miss}

"""
    with open('docs/audit/PHASE11_HISTORICAL_EVENT_EVIDENCE_AUDIT.md', 'w') as f:
        f.write(report)
        
    print(f"Source records: {c_source}")
    print(f"Canonical events: {c_canon}")
    print(f"Verified: {c_feat_ver}")
    print(f"Partial: {c_feat_par}")
    print(f"Unmatched: {c_feat_no}")
    print(f"Insufficient: {c_feat_miss}")

if __name__ == '__main__':
    main()
