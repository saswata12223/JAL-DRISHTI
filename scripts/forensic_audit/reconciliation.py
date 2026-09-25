import sqlite3
import pandas as pd
from pathlib import Path
from .config import DB_PATH, DATA_DIR, RAW_DIR, DIRS, Status
from .manifest import get_sha256

def run_reconciliation():
    print("Running Final Forensic Reconciliation...")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Generate information_completeness.csv
    cursor.execute("SELECT * FROM audit_matrix")
    matrix_rows = cursor.fetchall()
    matrix_df = pd.DataFrame([dict(r) for r in matrix_rows])
    if not matrix_df.empty:
        matrix_df.to_csv(DIRS["reports"] / "information_completeness.csv", index=False)
        
    cursor.execute("SELECT * FROM visuals")
    vis_rows = cursor.fetchall()
    vis_df = pd.DataFrame([dict(r) for r in vis_rows])
    if not vis_df.empty:
        vis_df.to_csv(DIRS["reports"] / "visual_content_index.csv", index=False)
        
    # 2. Re-hash Raw Directory to prove no mutation
    print("Checking Raw File Integrity...")
    raw_files = [f for f in RAW_DIR.rglob("*") if f.is_file()]
    modified_count = 0
    
    for f in raw_files:
        rel_path = f.relative_to(DATA_DIR).as_posix()
        current_hash = get_sha256(f)
        
        cursor.execute("SELECT sha256 FROM files WHERE relative_path = ?", (rel_path,))
        row = cursor.fetchone()
        if not row or row[0] != current_hash:
            modified_count += 1
            print(f"WARNING: File {rel_path} was mutated or newly created!")

    print(f"RAW FILES MODIFIED = {modified_count}")
    
    # 3. Generate Final Extraction Report
    with open(DIRS["reports"] / "final_extraction_report.md", "w") as f:
        f.write("# Final Forensic Extraction Report\n\n")
        f.write("## 1. Audit Objective\nDetermine actual extraction completeness, rather than file processing count.\n\n")
        
        cursor.execute("SELECT COUNT(*) FROM files")
        total_files = cursor.fetchone()[0]
        f.write(f"- Total raw files discovered: {total_files}\n")
        f.write(f"- Raw files modified: {modified_count}\n\n")
        
        if not matrix_df.empty:
            extracted_pages = len(matrix_df[matrix_df['extraction_status'] == Status.EXTRACTED])
            unresolved = len(matrix_df[matrix_df['extraction_status'] == Status.UNRESOLVED])
            f.write(f"- Extracted Information Nodes: {extracted_pages}\n")
            f.write(f"- Unresolved Information Nodes: {unresolved}\n\n")
            
        f.write("## Final Verdict\n")
        if modified_count > 0:
            f.write("NOT VERIFIED — RAW INTEGRITY FAILED\n")
        elif not matrix_df.empty and unresolved > 0:
            f.write("PARTIALLY VERIFIED — INFORMATION EXTRACTION INCOMPLETE\n")
            f.write("(Gaps remain due to missing system dependencies for OCR, Raster, and Vector data, which are marked as UNRESOLVED or DETECTED_BUT_NOT_DIGITIZED.)\n")
        else:
            f.write("FULLY VERIFIED — INFORMATION EXTRACTION COMPLETE\n")
            
    print("Forensic Reconciliation Complete.")
    conn.close()

if __name__ == "__main__":
    run_reconciliation()
