import pymupdf
import re
from pathlib import Path

def extract_images(pdf_path, output_dir):
    """
    Extract embedded images from a PDF using PyMuPDF.
    Returns list of metadata for extracted images.
    """
    metadata = []
    try:
        doc = pymupdf.open(str(pdf_path))
        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)
            
            for image_index, img in enumerate(image_list):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                image_width = base_image["width"]
                image_height = base_image["height"]
                
                # Filter out very small images (likely icons or logos)
                if image_width < 100 or image_height < 100:
                    continue
                    
                image_filename = f"page{page_num+1}_img{image_index}.{image_ext}"
                image_filepath = output_dir / image_filename
                
                with open(image_filepath, "wb") as f:
                    f.write(image_bytes)
                    
                metadata.append({
                    "page": page_num + 1,
                    "image_id": image_index,
                    "width": image_width,
                    "height": image_height,
                    "format": image_ext,
                    "source_pdf": pdf_path.name,
                    "path": str(image_filepath)
                })
        doc.close()
    except Exception as e:
        print(f"Error extracting images from {pdf_path}: {e}")
        
    return metadata

def classify_visual_content(page_text, image_metadata):
    """
    Attempt to classify a page's visual content based on surrounding text and heuristics.
    """
    page_text_lower = page_text.lower()
    
    if re.search(r'\b(map|catchment|basin)\b', page_text_lower):
        return "map", "LOW" # Usually maps
    elif re.search(r'\b(hydrograph|water level|discharge)\b', page_text_lower) and len(image_metadata) > 0:
        return "hydrograph", "LOW"
    elif re.search(r'\b(rainfall|precipitation)\b', page_text_lower) and len(image_metadata) > 0:
        return "rainfall_graph", "LOW"
    elif re.search(r'\b(cross section|elevation)\b', page_text_lower):
        return "cross_section", "LOW"
    
    # If no keywords matched but there's a big image
    if len(image_metadata) > 0:
        return "unknown", "LOW"
        
    return None, None
