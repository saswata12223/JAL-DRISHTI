import json
import csv
import pandas as pd
from pathlib import Path
from ..database import get_db_connection, log_error
from ..config import DIRS

def extract_structured(file_record):
    """Extract structured data (JSON, CSV, etc)."""
    file_id = file_record['id']
    file_path = Path(file_record['absolute_path'])
    ext = file_record['extension']
    
    try:
        if ext in ['.json', '.geojson']:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            out_file = DIRS['json'] / f"{file_path.stem}_{file_id}.json"
            with open(out_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
                
            # If it's a feature collection (like IMD), let's flatten it to CSV as well
            if isinstance(data, dict) and data.get("type") == "FeatureCollection" and "features" in data:
                flatten_geojson(data, file_id, file_path.stem)
                
        elif ext in ['.csv', '.tsv', '.txt']:
            df = pd.read_csv(file_path, on_bad_lines='skip')
            out_file = DIRS['csv'] / f"{file_path.stem}_{file_id}.csv"
            df.to_csv(out_file, index=False)
            
        update_status(file_id, 'completed', 'structured', '1.0')
    except Exception as e:
        log_error(file_id, 'parsing_failed', str(e), ['json_load', 'pandas_read'], 'high')
        update_status(file_id, 'failed', 'structured', '1.0', error=str(e))

def flatten_geojson(data, file_id, stem):
    rows = []
    for f in data.get("features", []):
        row = {}
        row['geometry_type'] = f.get('geometry', {}).get('type')
        coords = f.get('geometry', {}).get('coordinates')
        if coords:
            row['longitude'] = coords[0]
            row['latitude'] = coords[1]
        
        props = f.get('properties', {})
        for k, v in props.items():
            row[k] = v
        rows.append(row)
        
    if rows:
        df = pd.DataFrame(rows)
        df.to_csv(DIRS['csv'] / f"{stem}_{file_id}_flattened.csv", index=False)

def update_status(file_id, status, extractor, version, error=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE files 
        SET status = ?, extractor = ?, extractor_version = ?, completed_at = datetime('now'), error = ?
        WHERE id = ?
    """, (status, extractor, version, error, file_id))
    conn.commit()
    conn.close()
