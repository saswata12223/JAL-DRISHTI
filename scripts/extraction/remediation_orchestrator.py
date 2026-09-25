import sqlite3
from pathlib import Path
import json
from fallback_extractors import (
    extract_pdf_ocr, extract_pdf_table, extract_raster_metadata, 
    extract_vector_metadata, extract_structured_data, Status
)

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed" / "forensic_extraction"
DB_PATH = PROCESSED_DIR / "forensic_catalog.sqlite"
OCR_DIR = PROCESSED_DIR / "ocr"
TABLE_DIR = PROCESSED_DIR / "tables_remediated"

OCR_DIR.mkdir(parents=True, exist_ok=True)
TABLE_DIR.mkdir(parents=True, exist_ok=True)

def remediate_audit_matrix():
    print("=== JAL DRISHTI REMEDIATION ORCHESTRATOR ===")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM audit_matrix WHERE extraction_status = 'UNRESOLVED' OR failure_reason LIKE '%REQUIRED_BUT_UNAVAILABLE%'")
    unresolved_rows = cursor.fetchall()
    
    print(f"Found {len(unresolved_rows)} unresolved gaps.")
    
    for row in unresolved_rows:
        file_path = DATA_DIR / row['file_path']
        page = row['page']
        content_type = row['content_type']
        row_id = row['id']
        
        # Determine fallback capability based on content type
        if "REQUIRED_BUT_UNAVAILABLE" in (row['failure_reason'] or ""):
            status, info = extract_pdf_ocr(file_path, page, OCR_DIR)
            new_reason = info.get("reason", "OCR Extracted")
            cursor.execute("UPDATE audit_matrix SET extraction_status = ?, failure_reason = ?, extraction_method = ? WHERE id = ?",
                           (status, new_reason, "pytesseract", row_id))
                           
        elif content_type == 'table':
            status, info = extract_pdf_table(file_path, page, TABLE_DIR)
            new_reason = info.get("reason", "Table Extracted via pdfplumber")
            cursor.execute("UPDATE audit_matrix SET extraction_status = ?, failure_reason = ?, extraction_method = ? WHERE id = ?",
                           (status, new_reason, "pdfplumber", row_id))
                           
        elif content_type == 'raster':
            status, info = extract_raster_metadata(file_path)
            new_reason = info.get("reason", "Raster Metadata via rasterio")
            cursor.execute("UPDATE audit_matrix SET extraction_status = ?, failure_reason = ?, extraction_method = ? WHERE id = ?",
                           (status, new_reason, "rasterio", row_id))
                           
        elif content_type == 'vector':
            status, info = extract_vector_metadata(file_path)
            new_reason = info.get("reason", "Vector Metadata via pyshp")
            cursor.execute("UPDATE audit_matrix SET extraction_status = ?, failure_reason = ?, extraction_method = ? WHERE id = ?",
                           (status, new_reason, "pyshp", row_id))
                           
        elif content_type.startswith('structured_data'):
            status, info = extract_structured_data(file_path)
            new_reason = info.get("reason", "Structured data checked")
            cursor.execute("UPDATE audit_matrix SET extraction_status = ?, failure_reason = ?, extraction_method = ? WHERE id = ?",
                           (status, new_reason, "native", row_id))
                           
    conn.commit()
    conn.close()
    print("=== REMEDIATION COMPLETE ===")

if __name__ == "__main__":
    remediate_audit_matrix()
