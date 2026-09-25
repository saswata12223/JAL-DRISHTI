import pandas as pd
from pathlib import Path
from .database import get_db_connection
from .config import PROCESSED_DIR, DIRS

def generate_reports():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Completeness Report
    cursor.execute("SELECT status, COUNT(*) as count FROM files GROUP BY status")
    status_counts = {row['status']: row['count'] for row in cursor.fetchall()}
    
    cursor.execute("SELECT COUNT(*) FROM files")
    total_files = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT extension, status, COUNT(*) as count FROM files GROUP BY extension, status")
    ext_counts = cursor.fetchall()
    
    with open(DIRS['reports'] / 'extraction_completeness_report.md', 'w') as f:
        f.write("# Extraction Completeness Report\n\n")
        f.write("## Total Files\n")
        f.write(f"- total_files: {total_files}\n")
        for k, v in status_counts.items():
            f.write(f"- {k}: {v}\n")
            
        f.write("\n## By Extension\n")
        ext_dict = {}
        for row in ext_counts:
            ext = row['extension']
            if ext not in ext_dict:
                ext_dict[ext] = {'total': 0, 'completed': 0, 'failed': 0}
            ext_dict[ext]['total'] += row['count']
            if row['status'] == 'completed':
                ext_dict[ext]['completed'] += row['count']
            elif row['status'] == 'failed':
                ext_dict[ext]['failed'] += row['count']
                
        for ext, counts in ext_dict.items():
            f.write(f"- {ext or 'None'}: Total: {counts['total']}, Processed: {counts['completed']}, Failed: {counts['failed']}\n")
            
    # Extraction Ledger
    cursor.execute("SELECT absolute_path, sha256, mime_type as file_type, size_bytes, status, error, extractor FROM files")
    ledger_rows = [dict(r) for r in cursor.fetchall()]
    pd.DataFrame(ledger_rows).to_csv(DIRS['reports'] / 'extraction_ledger.csv', index=False)
    
    # Failed Extractions
    cursor.execute("SELECT files.absolute_path as source, extraction_errors.reason, extraction_errors.error_details as error, extraction_errors.attempted_methods, extraction_errors.severity FROM extraction_errors JOIN files ON extraction_errors.file_id = files.id")
    failed_rows = [dict(r) for r in cursor.fetchall()]
    if failed_rows:
        pd.DataFrame(failed_rows).to_csv(DIRS['failed'] / 'failed_extractions.csv', index=False)
    
    conn.close()
    print("Reports generated in data/processed/extraction/reports/")
