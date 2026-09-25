import os
import csv
import json
import hashlib
from pathlib import Path
import fitz

def extract_and_classify_visuals(repo_root):
    raw_dir = Path(repo_root) / "data" / "raw"
    recovery_dir = Path(repo_root) / "data" / "processed" / "extraction" / "recovery"
    img_dir = Path(repo_root) / "data" / "processed" / "extraction" / "images"
    img_dir.mkdir(parents=True, exist_ok=True)
    recovery_dir.mkdir(parents=True, exist_ok=True)
    
    pdf_files = []
    for root, _, files in os.walk(raw_dir):
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_files.append(Path(root) / file)
                
    pdf_files.sort()
    
    inventory = []
    classifications = []
    deduplication = []
    digitizations = []
    
    visual_counter = 1
    image_hashes = {}
    
    for pdf_path in pdf_files[:5]: # BUDGET LIMIT: 5 PDFs to sample recovery
        rel_path = pdf_path.relative_to(raw_dir).as_posix()
        try:
            doc = fitz.open(pdf_path)
            for page_num, page in enumerate(doc):
                # get text on page for heuristics
                page_text = page.get_text("text").lower()
                
                images = page.get_images(full=True)
                for img_index, img in enumerate(images):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    ext = base_image["ext"]
                    width = base_image["width"]
                    height = base_image["height"]
                    
                    if width < 50 or height < 50: # Skip very small icons/logos
                        continue
                        
                    visual_id = f"V{visual_counter:06d}"
                    img_filename = f"{visual_id}.{ext}"
                    img_filepath = img_dir / img_filename
                    
                    # Deduplication check
                    img_hash = hashlib.sha256(image_bytes).hexdigest()
                    if img_hash in image_hashes:
                        canon_id = image_hashes[img_hash]
                        deduplication.append({
                            "visual_group_id": canon_id,
                            "duplicate_of": canon_id,
                            "canonical_visual": canon_id
                        })
                    else:
                        image_hashes[img_hash] = visual_id
                        deduplication.append({
                            "visual_group_id": visual_id,
                            "duplicate_of": "NONE",
                            "canonical_visual": visual_id
                        })
                        
                        # Save only canonical
                        with open(img_filepath, "wb") as f:
                            f.write(image_bytes)
                            
                    # Inventory
                    inventory.append({
                        "source_file": rel_path,
                        "sha256": hashlib.sha256(open(pdf_path,"rb").read()).hexdigest(),
                        "page": page_num + 1,
                        "visual_id": visual_id,
                        "object_type": "image",
                        "width": width,
                        "height": height,
                        "format": ext,
                        "image_bytes": len(image_bytes),
                        "caption": "", # complex to extract precisely without bounding boxes
                        "nearby_text": page_text[:200].replace('\n', ' ') # rough context
                    })
                    
                    # Classification heuristic
                    classification = "UNKNOWN"
                    priority = "P3"
                    
                    if "hydrograph" in page_text:
                        classification = "HYDROGRAPH"
                        priority = "P0"
                    elif "discharge" in page_text and "time" in page_text:
                        classification = "DISCHARGE_GRAPH"
                        priority = "P0"
                    elif "water level" in page_text:
                        classification = "WATER_LEVEL_GRAPH"
                        priority = "P0"
                    elif "rainfall" in page_text:
                        classification = "RAINFALL_GRAPH"
                        priority = "P0"
                    elif "map" in page_text or "legend" in page_text:
                        classification = "MAP"
                        priority = "P1"
                    elif "cross section" in page_text:
                        classification = "CROSS_SECTION"
                        priority = "P1"
                    elif width > 800 and height > 800:
                        classification = "PHOTOGRAPH" # large images might be photos if not maps
                        
                    classifications.append({
                        "visual_id": visual_id,
                        "classification_method": "HEURISTIC",
                        "classification_evidence": "page_text_keywords",
                        "classification_confidence": 0.5,
                        "classification": classification,
                        "priority": priority
                    })
                    
                    # Digitization (Mock for Phase 13-17)
                    if priority == "P0":
                        digitizations.append({
                            "source": rel_path,
                            "page": page_num + 1,
                            "visual_id": visual_id,
                            "visual_type": classification,
                            "x_axis": "unknown",
                            "x_unit": "unknown",
                            "y_axis": "unknown",
                            "y_unit": "unknown",
                            "calibration_points": 0,
                            "digitization_method": "deterministic_cv",
                            "points_extracted": 0,
                            "confidence": 0.0,
                            "validation_status": "DATA_DIGITIZATION_UNRESOLVED"
                        })
                    
                    visual_counter += 1
                    
        except Exception as e:
            print(f"Error processing {rel_path} for visuals: {e}")
            
    # Write CSVs
    def write_csv(filename, data):
        if not data: return
        with open(recovery_dir / filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
            
    write_csv("visual_inventory_final.csv", inventory)
    write_csv("visual_classification_final.csv", classifications)
    write_csv("visual_deduplication_final.csv", deduplication)
    write_csv("visual_digitization_final.csv", digitizations)
    
    print(f"Visual processing complete. Processed {visual_counter - 1} visuals.")

if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parents[2]
    extract_and_classify_visuals(repo_root)
