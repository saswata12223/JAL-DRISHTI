import shapefile
from shapely.geometry import shape, Point
from shapely.validation import make_valid
from shapely.ops import unary_union
import geopandas as gpd
import pandas as pd
import json

hb_path = 'data/raw/hydrobassins/asia/hybas_as_lev01-06_v1c/hybas_as_lev06_v1c.shp'
sf = shapefile.Reader(hb_path)
records = sf.records()
shapes = sf.shapes()

st_df = pd.read_csv('data/processed/ml/phase7c4d/station_spatial_inventory.csv')
st_pts = {row['station_id']: Point(row['longitude'], row['latitude']) for _, row in st_df.iterrows()}

with open('data/processed/ml/phase7c4c/source_candidates/gdacs_polygon_ep6.json') as f:
    g6 = json.load(f)
with open('data/processed/ml/phase7c4c/source_candidates/gdacs_polygon_ep31.json') as f:
    g31 = json.load(f)

geoms6 = [make_valid(shape(feat['geometry'])) for feat in g6['features'] if feat['geometry']['type'] in ['Polygon', 'MultiPolygon']]
geoms31 = [make_valid(shape(feat['geometry'])) for feat in g31['features'] if feat['geometry']['type'] in ['Polygon', 'MultiPolygon']]

poly6 = unary_union(geoms6)
poly31 = unary_union(geoms31)

uk = gpd.read_file('data/raw/reference_boundaries/uttarakhand/source/UTTARAKHAND_STATE_BDY.shp').to_crs('EPSG:4326').union_all()

basin_data = []
for rec, shp in zip(records, shapes):
    sb = shp.bbox
    uk_b = uk.bounds
    if sb[2] < uk_b[0] or sb[0] > uk_b[2] or sb[3] < uk_b[1] or sb[1] > uk_b[3]:
        continue
    geom = shape(shp)
    if geom.intersects(uk):
        hybas_id = rec['HYBAS_ID']
        stations_inside = [st for st, pt in st_pts.items() if geom.contains(pt)]
        inter_ep6 = geom.intersects(poly6)
        inter_ep31 = geom.intersects(poly31)
        basin_data.append({
            'HYBAS_ID': hybas_id,
            'SUB_AREA': rec['SUB_AREA'],
            'UP_AREA': rec['UP_AREA'],
            'NEXT_DOWN': rec['NEXT_DOWN'],
            'station_count': len(stations_inside),
            'stations': stations_inside,
            'intersects_ep6': inter_ep6,
            'intersects_ep31': inter_ep31
        })

df_res = pd.DataFrame(basin_data)
print(df_res[['HYBAS_ID', 'station_count', 'intersects_ep6', 'intersects_ep31', 'NEXT_DOWN']])
print('\nStations by basin:')
for _, r in df_res.iterrows():
    if r['station_count'] > 0:
        print(f"Basin {r['HYBAS_ID']} ({r['station_count']} stations): ep6={r['intersects_ep6']}, ep31={r['intersects_ep31']}")
        print(f"   Stations: {r['stations']}")
