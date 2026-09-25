import fitz  # PyMuPDF
from pathlib import Path

def analyze_pdf(file_path: Path):
    """
    Forensic analysis of a PDF file.
    Returns page-level metrics and extraction statuses.
    """
    try:
        doc = fitz.open(file_path)
    except Exception as e:
        return {"error": str(e), "pages": []}

    pages_data = []
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        
        # 1. Native text extraction
        text = page.get_text("text")
        native_text_length = len(text.strip())
        word_count = len(text.split())
        
        # 2. Image and Object detection
        image_list = page.get_images(full=True)
        image_count = len(image_list)
        
        # Determine text density (rough heuristic)
        page_area = page.rect.width * page.rect.height
        estimated_text_density = native_text_length / page_area if page_area > 0 else 0
        
        # 3. Classify Page Type and OCR Need
        page_classification = "UNKNOWN"
        ocr_status = "NOT_REQUIRED"
        
        if native_text_length > 500 and image_count == 0:
            page_classification = "NATIVE_TEXT"
        elif native_text_length < 50 and image_count > 0:
            page_classification = "SCANNED"
            ocr_status = "REQUIRED_BUT_UNAVAILABLE" # System lacks tesseract
        elif native_text_length > 0 and image_count > 0:
            page_classification = "MIXED"
            if estimated_text_density < 0.001:
                ocr_status = "REQUIRED_BUT_UNAVAILABLE"
        elif native_text_length < 50 and image_count == 0:
            # Mostly empty or vector graphics?
            page_classification = "SPARSE_TEXT"
        
        # Look for table structures (heuristic: many horizontal/vertical lines)
        paths = page.get_drawings()
        table_candidates = 0
        if len(paths) > 20: # arbitrary heuristic for grid lines
            page_classification = "TABLE_CANDIDATE" if page_classification == "UNKNOWN" else page_classification
            table_candidates = 1

        pages_data.append({
            "page_number": page_num + 1,
            "native_text_length": native_text_length,
            "word_count": word_count,
            "image_count": image_count,
            "estimated_text_density": estimated_text_density,
            "page_classification": page_classification,
            "ocr_status": ocr_status,
            "table_candidates": table_candidates
        })
        
    doc.close()
    return {"error": None, "pages": pages_data, "page_count": len(pages_data)}
