import os
import mimetypes
import json
import pandas as pd
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from .config import RAW_DIR, DIRS
from .database import get_db_connection
from .hashing import get_sha256

def build_inventory(force=False):
    """Recursively scans RAW_DIR and builds file manifest."""
    print(f"Scanning {RAW_DIR} for raw files...")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if force:
        cursor.execute("DELETE FROM files")
        conn.commit()

    all_files = []
    for root, _, files in os.walk(RAW_DIR):
        for f in files:
            all_files.append(Path(root) / f)
            
    print(f"Found {len(all_files)} total files.")
    
    # Check existing
    cursor.execute("SELECT absolute_path FROM files")
    existing = {row['absolute_path'] for row in cursor.fetchall()}
    
    new_files = [f for f in all_files if str(f) not in existing]
    print(f"{len(new_files)} new files to add to inventory.")

    hash_dict = defaultdict(list)
    
    for i, file_path in enumerate(new_files):
        if i % 100 == 0:
            print(f"Hashing {i}/{len(new_files)}...")
            
        rel_path = file_path.relative_to(RAW_DIR)
        stat = file_path.stat()
        file_hash = get_sha256(file_path)
        mime_type, _ = mimetypes.guess_type(file_path)
        
        category = "unknown"
        if "events" in file_path.parts: category = "events"
        elif "imd" in file_path.parts: category = "imd"
        elif "smap" in file_path.parts: category = "smap"
        elif "waterlevel" in file_path.parts: category = "waterlevel"
        elif "srtm" in file_path.parts: category = "srtm"
        elif "landcover" in file_path.parts: category = "landcover"
        elif "hydrobassins" in file_path.parts: category = "hydrobassins"
        
        cursor.execute("""
            INSERT INTO files (
                relative_path, absolute_path, filename, extension, mime_type,
                size_bytes, sha256, modified_time, file_category, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        """, (
            str(rel_path), str(file_path), file_path.name, file_path.suffix.lower(), 
            mime_type, stat.st_size, file_hash, stat.st_mtime, category
        ))
        
    conn.commit()
    
    # Process duplicate groups
    cursor.execute("SELECT id, sha256 FROM files")
    rows = cursor.fetchall()
    
    hash_to_ids = defaultdict(list)
    for row in rows:
        hash_to_ids[row['sha256']].append(row['id'])
        
    dup_counter = 1
    for hsh, ids in hash_to_ids.items():
        if len(ids) > 1:
            dup_group = f"DUP-{dup_counter:05d}"
            dup_counter += 1
            for fid in ids:
                cursor.execute("UPDATE files SET duplicate_group = ? WHERE id = ?", (dup_group, fid))
                
    conn.commit()
    
    # Generate Manifest
    cursor.execute("SELECT * FROM files")
    manifest_rows = [dict(r) for r in cursor.fetchall()]
    
    df = pd.DataFrame(manifest_rows)
    df.to_csv(DIRS['manifest'] / "file_manifest.csv", index=False)
    df.to_json(DIRS['manifest'] / "file_manifest.json", orient="records", indent=2)
    
    print("Inventory and duplicate detection complete.")
    conn.close()
