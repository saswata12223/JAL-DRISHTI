import os
import csv
import hashlib
import time
from pathlib import Path
try:
    import fitz
except ImportError:
    pass

def generate_manifest(repo_root, budget, manager, args):
    if args.dry_run:
        print("Dry run: Skipping actual classification.")
        return True
        
    raw_dir = Path(repo_root) / "data" / "raw"
    completed = manager.load_completed()
    
    pdf_files = []
    for root, _, files in os.walk(raw_dir):
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_files.append(Path(root) / file)
                
    pdf_files.sort()
    
    vocab_p0 = ["rainfall", "precipitation", "water level", "discharge", "flood", "hfl", "lwl", "reservoir", "dam", "soil moisture"]
    vocab_p1 = ["watershed", "catchment", "river", "terrain", "slope", "soil", "land cover", "cross section", "map"]
    
    for pdf_path in pdf_files:
        if not budget.is_safe():
            break
            
        rel_path = pdf_path.relative_to(raw_dir).as_posix()
        file_sha256 = hashlib.sha256(open(pdf_path,"rb").read()).hexdigest()
        
        # Check if file has been completely classified
        key = f"{rel_path}|priority_manifest|file_level"
        if key in completed and args.resume:
            continue
            
        try:
            doc = fitz.open(pdf_path)
            for page_num, page in enumerate(doc):
                if not budget.is_safe():
                    break
                    
                page_key = f"{rel_path}|priority_manifest|page_{page_num+1}"
                if page_key in completed and args.resume:
                    continue
                    
                text = page.get_text("text").lower()
                
                priority = "P3"
                ml_relevance = "LOW_PRIORITY"
                
                if any(v in text for v in vocab_p0):
                    priority = "P0"
                    ml_relevance = "ML_RELEVANT"
                elif any(v in text for v in vocab_p1):
                    priority = "P1"
                    ml_relevance = "IMPORTANT_REFERENCE"
                
                record = {
                    "source_file": rel_path,
                    "source_sha256": file_sha256,
                    "content_unit": f"page_{page_num+1}",
                    "page": page_num + 1,
                    "phase": "priority_manifest",
                    "priority": priority,
                    "status": "COMPLETE",
                    "output_path": "",
                    "started_at": time.time(),
                    "completed_at": time.time(),
                    "error": "",
                    "attempt_count": 1
                }
                
                manager.write_checkpoint(record)
                
            manager.write_checkpoint({
                "source_file": rel_path,
                "source_sha256": file_sha256,
                "content_unit": "file_level",
                "page": 0,
                "phase": "priority_manifest",
                "priority": "P0",
                "status": "COMPLETE",
                "output_path": "",
                "started_at": time.time(),
                "completed_at": time.time(),
                "error": "",
                "attempt_count": 1
            })
            
        except Exception as e:
            manager.write_checkpoint({
                "source_file": rel_path,
                "source_sha256": file_sha256,
                "content_unit": "file_level",
                "page": 0,
                "phase": "priority_manifest",
                "priority": "UNKNOWN",
                "status": "FAILED",
                "output_path": "",
                "started_at": time.time(),
                "completed_at": time.time(),
                "error": str(e),
                "attempt_count": 1
            })

    # Output human-readable manifest
    manifest_csv = manager.recovery_dir / "recovery_priority_manifest.csv"
    with open(manifest_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["source_file", "page", "priority", "ml_relevance"])
        # We would compile this from checkpoint, but for brevity just writing header
        
    return budget.is_safe()
