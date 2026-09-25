import fitz
import io
from PIL import Image
from pathlib import Path
from .config import Status, DIRS

def classify_image(image_bytes: bytes, width: int, height: int):
    """
    Very rough heuristic classification based on dimensions and properties.
    In a real system this would use CV or ML.
    """
    aspect_ratio = width / height if height > 0 else 1
    
    # Large, square-ish images are often maps
    if width > 800 and height > 800 and 0.8 < aspect_ratio < 1.2:
        return "MAP"
    
    # Wide rectangles might be hydrographs/charts
    if aspect_ratio > 2.0:
        return "HYDROGRAPH"
        
    return "PHOTOGRAPH" # fallback

def extract_visuals(file_path: Path, rel_path: str):
    """
    Extract embedded visuals from PDF using PyMuPDF.
    """
    visuals = []
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            image_list = page.get_images(full=True)
            
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = doc.extract_image(xref)
                if not base_image:
                    visuals.append({
                        "page": page_num + 1,
                        "image_id": f"img_{page_num+1}_{img_index}",
                        "classification": "UNKNOWN",
                        "status": Status.UNRESOLVED,
                        "output_path": ""
                    })
                    continue
                    
                image_bytes = base_image["image"]
                width = base_image["width"]
                height = base_image["height"]
                ext = base_image["ext"]
                
                # Classify
                classification = classify_image(image_bytes, width, height)
                
                # Save image
                out_name = f"{Path(rel_path).stem}_p{page_num+1}_{img_index}.{ext}"
                out_path = DIRS["images"] / out_name
                
                with open(out_path, "wb") as f:
                    f.write(image_bytes)
                    
                visuals.append({
                    "page": page_num + 1,
                    "image_id": f"img_{page_num+1}_{img_index}",
                    "classification": classification,
                    "status": Status.EXTRACTED, # Visual extracted as file (but data inside not digitized)
                    "digitization_status": Status.DETECTED_BUT_NOT_DIGITIZED, # Information inside image not digitized
                    "output_path": out_path.as_posix()
                })
        doc.close()
    except Exception as e:
        return {"error": str(e), "visuals": []}
        
    return {"error": None, "visuals": visuals}
