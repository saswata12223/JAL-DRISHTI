import argparse
import time
from pathlib import Path

from .config import init_directories
from .database import init_db, get_db_connection
from .inventory import build_inventory
from .reporting import generate_reports

from .extractors.structured import extract_structured
from .extractors.geospatial import extract_geospatial
from .extractors.pdf_processor import extract_pdf

def dispatch_file(file_record):
    ext = file_record['extension']
    
    if ext in ['.json', '.geojson', '.csv', '.tsv', '.txt']:
        extract_structured(file_record)
    elif ext in ['.tif', '.tiff', '.shp', '.gpkg']:
        extract_geospatial(file_record)
    elif ext in ['.pdf']:
        extract_pdf(file_record)
    else:
        # Mark as unsupported but completed/skipped
        conn = get_db_connection()
        conn.execute("UPDATE files SET status = 'completed', extractor = 'none', error = 'Unsupported format' WHERE id = ?", (file_record['id'],))
        conn.commit()
        conn.close()

def main():
    parser = argparse.ArgumentParser(description="Jal Drishti Exhaustive Extraction")
    parser.add_argument("--force", action="store_true", help="Force re-extraction of everything")
    parser.add_argument("--workers", type=int, default=1, help="Number of parallel workers")
    args = parser.parse_args()

    print("Initializing directories and database...")
    init_directories()
    init_db()

    print("Building inventory (Zero-Drop scan)...")
    build_inventory(force=args.force)

    # Fetch pending files
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM files WHERE status = 'pending' OR status = 'failed'")
    pending_files = [dict(r) for r in cursor.fetchall()]
    conn.close()

    print(f"Found {len(pending_files)} files to extract.")

    # In a real heavy-duty scenario we'd use ThreadPoolExecutor here,
    # but based on requirements and avoiding RAM exhaustion we run sequentially/controlled.
    for i, file_record in enumerate(pending_files):
        print(f"[{i+1}/{len(pending_files)}] Extracting {file_record['relative_path']}...")
        dispatch_file(file_record)

    print("Generating Completeness Reports...")
    generate_reports()
    print("Extraction Phase Complete.")

if __name__ == "__main__":
    main()
