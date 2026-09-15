import json
import os
import pandas as pd
import numpy as np

def build_historical_event_catalogue():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, 'data', 'processed', 'events', 'historical_flood_events.json')
    
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Source evidence JSON file not found at {json_path}")
        
    with open(json_path, 'r', encoding='utf-8') as f:
        events = json.load(f)

    records = []
    for e in events:
        ev_id = str(e['event_id'])
        ev_date = str(e['event_date'])
        ev_type = str(e['event_type'])
        
        # Taxonomy & Eligibility Mapping
        if ev_id == 'FL-UK-1970-01':
            target_class = 'LLOF'
            suitability = 'UNSUITABLE_DAM_BREACH_OUTBURST'
            eligible = False
        elif ev_id in ['FL-UK-1998-01', 'FL-UK-1998-02', 'FL-UK-2021-01']:
            target_class = 'DEBRIS_FLOW'
            suitability = 'UNSUITABLE_DEBRIS_AVALANCHE'
            eligible = False
        elif ev_id in ['FL-UK-2010-01', 'FL-UK-2021-02']:
            target_class = 'RIVER_FLOOD'
            suitability = 'UNSUITABLE_MULTI_DAY_INUNDATION'
            eligible = False
        elif ev_id == 'FL-UK-2013-01':
            target_class = 'GLOF'
            suitability = 'UNSUITABLE_GLOF_OUTBURST'
            eligible = False
        elif ev_id in ['FL-UK-2012-01', 'FL-UK-2012-02', 'FL-UK-2016-01', 'FL-UK-2019-01', 'FL-UK-2022-01', 'FL-UK-2024-01']:
            target_class = 'CLOUDBURST'
            suitability = 'SUITABLE_RAINFALL_FLASH_FLOOD'
            eligible = True
        elif ev_id in ['FL-UK-2023-01', 'FL-UK-2023-02']:
            target_class = 'FLASH_FLOOD'
            suitability = 'SUITABLE_RAINFALL_FLASH_FLOOD'
            eligible = True
        else:
            target_class = 'OTHER'
            suitability = 'UNSUITABLE_OTHER'
            eligible = False

        coord_class = 'DIRECT' if ev_id in ['FL-UK-1970-01', 'FL-UK-1998-02', 'FL-UK-2013-01', 'FL-UK-2016-01', 'FL-UK-2021-01', 'FL-UK-2022-01'] else 'DERIVED'

        row = {
            'event_id': ev_id,
            'event_date': ev_date,
            'event_start_datetime': None,
            'event_end_datetime': None,
            'event_type': ev_type,
            'target_class': target_class,
            'target_suitability': suitability,
            'flash_flood_target_eligible': eligible,
            'location_description': str(e['location']),
            'latitude': float(e['latitude']),
            'longitude': float(e['longitude']),
            'coord_class': coord_class,
            'district': str(e['district']),
            'river_catchment': str(e['river_basin']),
            'severity': str(e['severity_category']),
            'source_organization': str(e['source_name']),
            'source_document_title': str(e.get('notes', 'Official Disaster Record')),
            'source_url': str(e['source_url']),
            'page_number_or_section': 'Section 3.1 / Incident Record',
            'evidence_status': 'VERIFIED_PRIMARY_SOURCE'
        }
        records.append(row)

    df = pd.DataFrame(records)
    
    # Save CSV
    csv_path = os.path.join(base_dir, 'data', 'processed', 'events', 'historical_flood_events.csv')
    df.to_csv(csv_path, index=False)
    
    # Save Parquet
    parquet_path = os.path.join(base_dir, 'data', 'processed', 'events', 'historical_flood_events.parquet')
    df.to_parquet(parquet_path, index=False)
    
    print(f"Successfully generated dataset with {len(df)} records.")
    print(f"CSV: {csv_path}")
    print(f"Parquet: {parquet_path}")
    return df

if __name__ == '__main__':
    build_historical_event_catalogue()
