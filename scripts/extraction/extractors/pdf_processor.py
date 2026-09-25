import json
import traceback
from pathlib import Path
from .structured import update_status
from ..database import get_db_connection, log_error
from ..config import DIRS

# Optional dependencies handling
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

try:
    import pytesseract
    from PIL import Image
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

try:
    import camelot
    HAS_CAMELOT = True
except ImportError:
    HAS_CAMELOT = False


def extract_pdf(file_record):
    """Orchestrate PDF extraction pipeline."""
    file_id = file_record['id']
    file_path = Path(file_record['absolute_path'])
    
    if not HAS_PYMUPDF and not HAS_PDFPLUMBER:
        log_error(file_id, 'missing_dependency', 'No PDF library available (PyMuPDF, pdfplumber)', [], 'high')
        update_status(file_id, 'failed', 'pdf_processor', '1.0', error='No PDF libraries')
        return

    try:
        # Stage 1: Metadata & Basic Iteration
        if HAS_PYMUPDF:
            doc = fitz.open(file_path)
            metadata = doc.metadata
            page_count = doc.page_count
            
            with open(DIRS['metadata'] / f"{file_path.stem}_{file_id}_meta.json", "w", encoding="utf-8") as f:
                json.dump({"page_count": page_count, "metadata": metadata}, f, indent=2)
                
            for page_num in range(page_count):
                page = doc.load_page(page_num)
                text = page.get_text()
                
                # Native Text
                if text.strip():
                    with open(DIRS['text'] / f"{file_path.stem}_{file_id}_page_{page_num}.txt", "w", encoding="utf-8") as f:
                        f.write(text)
                else:
                    # Stage 3: OCR Required
                    if HAS_TESSERACT:
                        pix = page.get_pixmap(dpi=300)
                        img_path = DIRS['images'] / f"temp_{file_id}_{page_num}.png"
                        pix.save(img_path)
                        img = Image.open(img_path)
                        ocr_text = pytesseract.image_to_string(img)
                        if ocr_text.strip():
                            with open(DIRS['ocr'] / f"{file_path.stem}_{file_id}_page_{page_num}_ocr.txt", "w", encoding="utf-8") as f:
                                f.write(ocr_text)
                        # Clean up temp image if no chart/map detection is needed
                        # (Leaving it for figures extraction in real pipeline)
                    else:
                        log_error(file_id, 'ocr_required', f"Page {page_num} requires OCR but tesseract is absent", ['tesseract'], 'medium')

                # Stage 4: Tables
                # Fallback to pdfplumber for tables if camelot is missing
                
            doc.close()
        
        elif HAS_PDFPLUMBER:
            with pdfplumber.open(file_path) as pdf:
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        with open(DIRS['text'] / f"{file_path.stem}_{file_id}_page_{i}.txt", "w", encoding="utf-8") as f:
                            f.write(text)
                    
                    tables = page.extract_tables()
                    if tables:
                        for j, table in enumerate(tables):
                            import pandas as pd
                            df = pd.DataFrame(table[1:], columns=table[0])
                            df.to_csv(DIRS['tables'] / f"{file_path.stem}_{file_id}_page_{i}_table_{j}.csv", index=False)
                            
        update_status(file_id, 'completed', 'pdf_processor', '1.0')
        
    except Exception as e:
        log_error(file_id, 'pdf_extraction_failed', str(e) + "\n" + traceback.format_exc(), ['pymupdf', 'pdfplumber'], 'high')
        update_status(file_id, 'failed', 'pdf_processor', '1.0', error=str(e))
