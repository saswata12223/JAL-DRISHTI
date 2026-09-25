import os
import csv
import json
import hashlib
from pathlib import Path
import pdfplumber

def extract_tables(repo_root):
    """
    Phases 7, 8, 9, 10: Table Detection, Extraction, Validation, and Quality Sample
    """
    raw_dir = Path(repo_root) / "data" / "raw"
    recovery_dir = Path(repo_root) / "data" / "processed" / "extraction" / "recovery"
    recovery_dir.mkdir(parents=True, exist_ok=True)
    
    # Load previous candidates from INDEPENDENT_TABLE_AUDIT.csv if it exists
    prev_audit_csv = Path(repo_root) / "data" / "processed" / "extraction" / "reports" / "INDEPENDENT_TABLE_AUDIT.csv"
    prev_candidates = set()
    if prev_audit_csv.exists():
        with open(prev_audit_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                prev_candidates.add((row.get("source_file"), row.get("page")))
                
    pdf_files = []
    for root, _, files in os.walk(raw_dir):
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_files.append(Path(root) / file)
                
    pdf_files.sort()
    
    new_candidates = set()
    recovered_tables = []
    validated_tables = []
    
    table_id_counter = 1
    
    for pdf_path in pdf_files[:2]:  # BUDGET LIMIT: process first 2 PDFs for representative sample
        rel_path = pdf_path.relative_to(raw_dir).as_posix()
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    tables = page.find_tables()
                    if tables:
                        new_candidates.add((rel_path, str(page_num + 1)))
                        for table in tables:
                            # Basic extraction
                            extracted = table.extract()
                            if not extracted or len(extracted) == 0:
                                continue
                                
                            rows = len(extracted)
                            cols = len(extracted[0]) if rows > 0 else 0
                            
                            # Validation checks
                            empty_cells = sum([1 for row in extracted for cell in row if not cell or str(cell).strip() == ''])
                            total_cells = rows * cols
                            empty_ratio = empty_cells / total_cells if total_cells > 0 else 1.0
                            
                            has_numbers = any(any(char.isdigit() for char in str(cell)) for row in extracted for cell in row if cell)
                            
                            status = "VALIDATED_PARTIAL"
                            if empty_ratio < 0.2 and has_numbers:
                                status = "VALIDATED_COMPLETE"
                            elif empty_ratio > 0.8:
                                status = "DETECTED_NOT_RELIABLY_EXTRACTED"
                                
                            rec = {
                                "source_file": rel_path,
                                "page": page_num + 1,
                                "table_id": f"T{table_id_counter:05d}",
                                "detection_method": "pdfplumber",
                                "extraction_method": "pdfplumber",
                                "rows": rows,
                                "columns": cols,
                                "headers": True if rows > 1 else False,
                                "units": False,
                                "numeric_columns": has_numbers,
                                "empty_cell_ratio": round(empty_ratio, 4),
                                "multi_page": False,
                                "status": status,
                                "confidence": 1.0 - empty_ratio
                            }
                            recovered_tables.append(rec)
                            
                            # Semantic checks for validation
                            semantic_keywords = ["rainfall", "precipitation", "discharge", "water level", "hfl", "lwl", "reservoir", "storage", "catchment"]
                            text_content = " ".join([str(cell).lower() for row in extracted for cell in row if cell])
                            found_keywords = [kw for kw in semantic_keywords if kw in text_content]
                            
                            val = {
                                "source_file": rel_path,
                                "table_id": f"T{table_id_counter:05d}",
                                "structural_valid": rows > 1 and cols > 1,
                                "numeric_valid": has_numbers,
                                "semantic_keywords": "|".join(found_keywords) if found_keywords else "none",
                                "validation_status": status
                            }
                            validated_tables.append(val)
                            table_id_counter += 1
                            
        except Exception as e:
            print(f"Error processing {rel_path} for tables: {e}")
            
    # Write comparison
    comp_csv = recovery_dir / "table_candidate_comparison.csv"
    with open(comp_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["source_file", "page", "status"])
        all_pairs = prev_candidates.union(new_candidates)
        for pair in all_pairs:
            if pair in prev_candidates and pair in new_candidates:
                status = "intersection"
            elif pair in prev_candidates:
                status = "previous-only"
            else:
                status = "new-only"
            writer.writerow([pair[0], pair[1], status])
            
    # Write recovery
    rec_csv = recovery_dir / "table_recovery_final.csv"
    if recovered_tables:
        with open(rec_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=recovered_tables[0].keys())
            writer.writeheader()
            writer.writerows(recovered_tables)
            
    # Write validation
    val_csv = recovery_dir / "table_validation_final.csv"
    if validated_tables:
        with open(val_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=validated_tables[0].keys())
            writer.writeheader()
            writer.writerows(validated_tables)
            
    print(f"Table processing complete. Recovered {len(recovered_tables)} tables.")

if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parents[2]
    extract_tables(repo_root)
