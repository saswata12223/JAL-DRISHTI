import sqlite3
import pandas as pd
from pathlib import Path
from tqdm import tqdm

from .config import DB_PATH, RAW_DIR, init_directories, Status, ContentType, DIRS
from .manifest import init_db, build_manifest
from .pdf_analyzer import analyze_pdf
from .table_analyzer import extract_tables
from .visuals import extract_visuals
from .spatial import analyze_spatial
from .structured import audit_structured
from .nlp import audit_nlp
from .reconciliation import run_reconciliation

def process_file(conn, file_path: Path, rel_path: str):
    cursor = conn.cursor()
    ext = file_path.suffix.lower()
    
    # Check if spatial
    spatial_res = analyze_spatial(file_path)
    if spatial_res:
        cursor.execute('''
        INSERT INTO audit_matrix (file_path, page, content_type, detection_status, extraction_status, extraction_method, failure_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (rel_path, -1, spatial_res["content_type"], spatial_res["detection_status"], spatial_res["extraction_status"], spatial_res["extraction_method"], spatial_res["failure_reason"]))
        
    # Check if structured
    struct_res = audit_structured(file_path)
    if struct_res:
        cursor.execute('''
        INSERT INTO audit_matrix (file_path, page, content_type, detection_status, extraction_status, extraction_method, failure_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (rel_path, -1, struct_res["content_type"], struct_res["detection_status"], struct_res["extraction_status"], struct_res["extraction_method"], struct_res["failure_reason"]))
        
    # PDF specific
    if ext == ".pdf":
        # 1. Page Analysis (Native Text vs OCR)
        pdf_res = analyze_pdf(file_path)
        if pdf_res["error"]:
            cursor.execute("UPDATE files SET processing_status = 'failed' WHERE relative_path = ?", (rel_path,))
            return
            
        for page_data in pdf_res["pages"]:
            cursor.execute('''
            INSERT INTO audit_matrix (file_path, page, content_type, detection_status, extraction_status, extraction_method, failure_reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (rel_path, page_data["page_number"], page_data["page_classification"], Status.EXTRACTED, 
                  Status.UNRESOLVED if page_data["ocr_status"] == "REQUIRED_BUT_UNAVAILABLE" else Status.EXTRACTED,
                  "PyMuPDF", page_data["ocr_status"]))
                  
        # 2. Table Analysis
        table_res = extract_tables(file_path)
        if not table_res["error"]:
            for t in table_res["tables"]:
                cursor.execute('''
                INSERT INTO audit_matrix (file_path, page, content_type, detection_status, extraction_status, extraction_method, failure_reason)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (rel_path, t["page"], ContentType.TABLE, Status.EXTRACTED, t["status"], "pdfplumber", t["reason"]))
                
        # 3. Visuals Analysis
        vis_res = extract_visuals(file_path, rel_path)
        if not vis_res["error"]:
            for v in vis_res["visuals"]:
                cursor.execute('''
                INSERT INTO visuals (source_file, page, image_id, content_type, classification_method, extraction_status, digitization_status, output_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (rel_path, v["page"], v["image_id"], v["classification"], "heuristic", v["status"], v["digitization_status"], v["output_path"]))
                
        # 4. Domain NLP
        nlp_res = audit_nlp(file_path)
        if not nlp_res["error"]:
            for n in nlp_res["entities"]:
                cursor.execute('''
                INSERT INTO audit_matrix (file_path, page, content_type, detection_status, extraction_status, extraction_method, output_reference)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (rel_path, n["page"], ContentType.DOMAIN_ENTITY, Status.EXTRACTED, Status.EXTRACTED, "regex", n["entity"][:20]))

    cursor.execute("UPDATE files SET processing_status = 'processed' WHERE relative_path = ?", (rel_path,))
    conn.commit()


def run_orchestrator():
    print("=== STARTING FORENSIC AUDIT ===")
    conn = init_db()
    build_manifest(conn)
    
    cursor = conn.cursor()
    cursor.execute("SELECT relative_path FROM files WHERE processing_status != 'processed'")
    files_to_process = [r[0] for r in cursor.fetchall()]
    
    print(f"Processing {len(files_to_process)} files...")
    for rel_path in tqdm(files_to_process):
        file_path = RAW_DIR / rel_path
        process_file(conn, file_path, rel_path)
        
    print("=== FORENSIC AUDIT PROCESSING COMPLETE ===")
    conn.close()
    
    run_reconciliation()

if __name__ == "__main__":
    run_orchestrator()
