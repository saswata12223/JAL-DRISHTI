import os
import sqlite3
import json
from pathlib import Path
from .config import DB_PATH, DIRS

def run_gap_analysis():
    print("Running Gap Analysis...")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Create Gap Analysis Markdown Report
    gap_md_path = DIRS["reports"] / "gap_analysis.md"
    
    # 1. Check File Level Status
    cursor.execute("SELECT status, COUNT(*) as c FROM files GROUP BY status")
    file_status = {row['status']: row['c'] for row in cursor.fetchall()}

    # 2. Check Failed Extractions
    cursor.execute("SELECT extension, COUNT(*) as c FROM files WHERE status = 'failed' GROUP BY extension")
    failed_exts = {row['extension']: row['c'] for row in cursor.fetchall()}

    # 3. Check PDF Pages (native text vs ocr required)
    # The first pass didn't create a 'pages' table, it wrote text to output directories.
    # We will need to scan the text directories or just rely on the DB if we had created a pages table.
    # In this new phase we will create a pages table and images table.
    # For now, let's just categorize the missing gaps based on file extensions and DB 'error' column.
    
    cursor.execute("SELECT extension, error FROM files WHERE status = 'failed'")
    failed_files = cursor.fetchall()
    
    categories = {
        'OCR_REQUIRED': 0,
        'TABLE_EXTRACTION_REQUIRED': 0,
        'RASTER_EXTRACTION_REQUIRED': 0,
        'VECTOR_EXTRACTION_REQUIRED': 0,
        'IMAGE_EXTRACTION_REQUIRED': 0,
        'CHART_OR_MAP_EXTRACTION_REQUIRED': 0,
        'CORRUPTED': 0,
        'DUPLICATE': 0,
        'ALREADY_COMPLETE': 0
    }
    
    for row in failed_files:
        ext = row['extension']
        error = row['error'] or ''
        if ext == '.pdf':
            categories['OCR_REQUIRED'] += 1
            categories['TABLE_EXTRACTION_REQUIRED'] += 1
            categories['IMAGE_EXTRACTION_REQUIRED'] += 1
        elif ext in ['.tif', '.tiff']:
            categories['RASTER_EXTRACTION_REQUIRED'] += 1
        elif ext in ['.shp', '.gpkg', '.geojson']:
            categories['VECTOR_EXTRACTION_REQUIRED'] += 1
    
    with open(gap_md_path, "w", encoding="utf-8") as f:
        f.write("# Extraction Gap Analysis\n\n")
        f.write("## File Status\n")
        for k, v in file_status.items():
            f.write(f"- **{k}**: {v}\n")
            
        f.write("\n## Unresolved Categorization\n")
        for k, v in categories.items():
            f.write(f"- {k}: {v}\n")
    
    # 4. Environment Check
    env_data = {
        "tesseract": os.system("where tesseract >nul 2>&1") == 0,
        "ghostscript": os.system("where gs >nul 2>&1") == 0,
        "gdalinfo": os.system("where gdalinfo >nul 2>&1") == 0,
        "python": os.popen("python --version").read().strip(),
    }
    
    env_json_path = DIRS["reports"] / "extraction_environment_final.json"
    with open(env_json_path, "w") as f:
        json.dump(env_data, f, indent=4)
        
    print(f"Gap analysis written to {gap_md_path}")
    print(f"Environment status written to {env_json_path}")
    conn.close()

if __name__ == "__main__":
    run_gap_analysis()
