import sqlite3
import json
from .config import DB_PATH

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Files tracking for resumability and manifest
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        relative_path TEXT UNIQUE,
        absolute_path TEXT,
        filename TEXT,
        extension TEXT,
        mime_type TEXT,
        size_bytes INTEGER,
        sha256 TEXT,
        modified_time REAL,
        file_category TEXT,
        duplicate_group TEXT,
        status TEXT DEFAULT 'pending',
        started_at TEXT,
        completed_at TEXT,
        attempt_count INTEGER DEFAULT 0,
        extractor TEXT,
        extractor_version TEXT,
        error TEXT
    )
    """)
    
    # Provenance tracking
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS provenance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER,
        source_path TEXT,
        entity_type TEXT,
        item_path TEXT,
        extracted_value TEXT,
        extraction_method TEXT,
        confidence REAL,
        FOREIGN KEY (file_id) REFERENCES files (id)
    )
    """)

    # PDF Pages
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pdf_pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER,
        page_number INTEGER,
        native_text_length INTEGER,
        ocr_required BOOLEAN,
        ocr_status TEXT,
        FOREIGN KEY (file_id) REFERENCES files (id)
    )
    """)

    # Extracted Tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER,
        page_number INTEGER,
        table_id INTEGER,
        method TEXT,
        rows INTEGER,
        columns INTEGER,
        confidence REAL,
        output_file TEXT,
        FOREIGN KEY (file_id) REFERENCES files (id)
    )
    """)
    
    # Raster Metadata
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS raster_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER,
        width INTEGER,
        height INTEGER,
        count INTEGER,
        dtype TEXT,
        crs TEXT,
        epsg INTEGER,
        bounds_json TEXT,
        resolution_json TEXT,
        nodata REAL,
        FOREIGN KEY (file_id) REFERENCES files (id)
    )
    """)

    # Vector Metadata
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vector_layers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER,
        geometry_type TEXT,
        feature_count INTEGER,
        crs TEXT,
        epsg INTEGER,
        bounds_json TEXT,
        fields_json TEXT,
        FOREIGN KEY (file_id) REFERENCES files (id)
    )
    """)
    
    # Failed extractions details
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS extraction_errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER,
        reason TEXT,
        error_details TEXT,
        attempted_methods TEXT,
        severity TEXT,
        FOREIGN KEY (file_id) REFERENCES files (id)
    )
    """)

    conn.commit()
    conn.close()

def log_error(file_id, reason, error_details, attempted_methods, severity):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO extraction_errors (file_id, reason, error_details, attempted_methods, severity) VALUES (?, ?, ?, ?, ?)",
        (file_id, reason, error_details, json.dumps(attempted_methods), severity)
    )
    conn.commit()
    conn.close()
