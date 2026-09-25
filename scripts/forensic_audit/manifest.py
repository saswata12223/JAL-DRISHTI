import hashlib
import sqlite3
import datetime
from pathlib import Path
from .config import DB_PATH, RAW_DIR, DATA_DIR, init_directories, DIRS
import pandas as pd

def get_sha256(file_path: Path, block_size: int = 65536) -> str:
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(block_size), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except Exception as e:
        return f"ERROR: {str(e)}"

def init_db():
    init_directories()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Files table (Inventory)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        relative_path TEXT UNIQUE,
        file_type TEXT,
        file_size INTEGER,
        sha256 TEXT,
        modified_time TEXT,
        duplicate_group TEXT,
        canonical_file TEXT,
        processing_status TEXT DEFAULT 'unprocessed'
    )
    ''')
    
    # Audit matrix table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS audit_matrix (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT,
        page INTEGER,
        content_type TEXT,
        detection_status TEXT,
        extraction_status TEXT,
        extraction_method TEXT,
        confidence REAL,
        output_reference TEXT,
        failure_reason TEXT
    )
    ''')

    # Visuals index
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS visuals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_file TEXT,
        page INTEGER,
        image_id TEXT,
        content_type TEXT,
        classification_method TEXT,
        extraction_status TEXT,
        digitization_status TEXT,
        confidence REAL,
        output_path TEXT
    )
    ''')
    
    conn.commit()
    return conn

def build_manifest(conn):
    print("Building File Manifest...")
    cursor = conn.cursor()
    raw_files = [f for f in RAW_DIR.rglob("*") if f.is_file()]
    
    manifest_data = []
    hash_map = {}
    
    for f in raw_files:
        rel_path = f.relative_to(DATA_DIR).as_posix()
        file_type = f.suffix.lower()
        file_size = f.stat().st_size
        modified_time = datetime.datetime.fromtimestamp(f.stat().st_mtime).isoformat()
        
        # Check if already in DB
        cursor.execute("SELECT sha256, duplicate_group, canonical_file FROM files WHERE relative_path = ?", (rel_path,))
        row = cursor.fetchone()
        
        if row:
            sha256 = row[0]
            duplicate_group = row[1]
            canonical_file = row[2]
        else:
            sha256 = get_sha256(f)
            if sha256 in hash_map:
                duplicate_group = sha256
                canonical_file = hash_map[sha256]
            else:
                hash_map[sha256] = rel_path
                duplicate_group = None
                canonical_file = rel_path
                
            cursor.execute('''
            INSERT INTO files (relative_path, file_type, file_size, sha256, modified_time, duplicate_group, canonical_file)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (rel_path, file_type, file_size, sha256, modified_time, duplicate_group, canonical_file))
            
        manifest_data.append({
            "relative_path": rel_path,
            "file_type": file_type,
            "file_size": file_size,
            "sha256": sha256,
            "modified_time": modified_time,
            "duplicate_group": duplicate_group,
            "canonical_file": canonical_file
        })
        
    conn.commit()
    
    # Write CSV manifest
    df = pd.DataFrame(manifest_data)
    df.to_csv(DIRS["manifest"] / "file_manifest_v2.csv", index=False)
    print(f"Manifest written with {len(df)} files.")
