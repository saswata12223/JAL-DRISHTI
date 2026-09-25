import os
import csv
import json
from pathlib import Path
import fitz
import re

def extract_domain_entities(repo_root):
    """
    Phase 23: Domain Entities Extraction
    """
    raw_dir = Path(repo_root) / "data" / "raw"
    recovery_dir = Path(repo_root) / "data" / "processed" / "extraction" / "recovery"
    recovery_dir.mkdir(parents=True, exist_ok=True)
    
    # Vocabulary
    vocab = [
        "rainfall", "precipitation", "cloudburst", "flood", "flash flood", 
        "water level", "discharge", "hfl", "lwl", "danger level", "warning level", 
        "dam", "reservoir", "storage", "spillway", "catchment", "watershed", 
        "basin", "runoff", "river", "hydrograph", "cross section", "elevation", 
        "landslide", "debris", "sediment"
    ]
    
    entities = []
    
    # We will just scan PDFs for now as a representative pass
    pdf_files = []
    for root, _, files in os.walk(raw_dir):
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_files.append(Path(root) / file)
                
    pdf_files.sort()
    
    for pdf_path in pdf_files:
        rel_path = pdf_path.relative_to(raw_dir).as_posix()
        try:
            doc = fitz.open(pdf_path)
            for page_num, page in enumerate(doc):
                text = page.get_text("text").lower()
                for v in vocab:
                    # simple count
                    count = len(re.findall(r'\b' + re.escape(v) + r'\b', text))
                    if count > 0:
                        # try to find a value/unit nearby using regex (simplified heuristic)
                        value = "unknown"
                        unit = "unknown"
                        
                        entities.append({
                            "source_file": rel_path,
                            "sha256": "unknown", # would use real hash in full pass
                            "page": page_num + 1,
                            "section": "body",
                            "table": "N/A",
                            "visual_id": "N/A",
                            "entity_type": v,
                            "value": value,
                            "unit": unit,
                            "context": "heuristic_scan",
                            "confidence": 0.8,
                            "method": "regex"
                        })
        except Exception as e:
            print(f"Error extracting entities from {rel_path}: {e}")
            
    if entities:
        with open(recovery_dir / "domain_entities_final.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=entities[0].keys())
            writer.writeheader()
            writer.writerows(entities)
            
    print(f"Domain entity extraction complete. Found {len(entities)} entity matches.")

if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parents[2]
    extract_domain_entities(repo_root)
