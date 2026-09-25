import json
import pandas as pd
from pathlib import Path
from PIL import Image
import io
import shutil

# Check capabilities
try:
    import pytesseract
    # Test if tesseract is on PATH
    # The winget install usually places it in C:\Program Files\Tesseract-OCR\tesseract.exe
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False
    
try:
    import fitz # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    
try:
    import rasterio
    RASTERIO_AVAILABLE = True
except ImportError:
    RASTERIO_AVAILABLE = False

try:
    import shapefile # pyshp
    PYSHP_AVAILABLE = True
except ImportError:
    PYSHP_AVAILABLE = False

class Status:
    EXTRACTED = "EXTRACTED"
    PARTIALLY_EXTRACTED = "PARTIALLY_EXTRACTED"
    DETECTED_BUT_NOT_DIGITIZED = "DETECTED_BUT_NOT_DIGITIZED"
    UNRESOLVED = "UNRESOLVED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


def extract_pdf_ocr(file_path: Path, page_num: int, output_dir: Path):
    if not TESSERACT_AVAILABLE:
        return Status.UNRESOLVED, {"reason": "Tesseract binary unavailable"}
        
    try:
        # We need to render the page to an image.
        if not PYMUPDF_AVAILABLE:
            return Status.UNRESOLVED, {"reason": "PyMuPDF unavailable for rendering"}
            
        doc = fitz.open(file_path)
        page = doc.load_page(page_num - 1)
        # render at 300 DPI for OCR
        pix = page.get_pixmap(dpi=300)
        img = Image.open(io.BytesIO(pix.tobytes()))
        
        # Simple OCR
        text = pytesseract.image_to_string(img)
        
        if not text.strip():
            return Status.PARTIALLY_EXTRACTED, {"reason": "OCR yielded empty text"}
            
        out_file = output_dir / f"{file_path.stem}_p{page_num}_ocr.txt"
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(text)
            
        return Status.EXTRACTED, {"output_path": str(out_file), "word_count": len(text.split())}
    except Exception as e:
        return Status.UNRESOLVED, {"reason": str(e)}

def extract_pdf_table(file_path: Path, page_num: int, output_dir: Path):
    if not PDFPLUMBER_AVAILABLE:
        return Status.UNRESOLVED, {"reason": "pdfplumber unavailable"}
        
    try:
        with pdfplumber.open(file_path) as pdf:
            page = pdf.pages[page_num - 1]
            tables = page.extract_tables()
            
            if not tables:
                return Status.UNRESOLVED, {"reason": "No tables detected by pdfplumber"}
                
            out_files = []
            for i, tbl in enumerate(tables):
                df = pd.DataFrame(tbl[1:], columns=tbl[0] if tbl[0] else None)
                out_path = output_dir / f"{file_path.stem}_p{page_num}_table{i}.csv"
                df.to_csv(out_path, index=False)
                out_files.append(str(out_path))
                
            return Status.EXTRACTED, {"output_paths": out_files}
    except Exception as e:
        return Status.UNRESOLVED, {"reason": str(e)}

def extract_raster_metadata(file_path: Path):
    if not RASTERIO_AVAILABLE:
        return Status.UNRESOLVED, {"reason": "rasterio unavailable"}
        
    try:
        with rasterio.open(file_path) as src:
            meta = {
                "driver": src.driver,
                "width": src.width,
                "height": src.height,
                "count": src.count,
                "crs": src.crs.to_string() if src.crs else None,
                "dtypes": src.dtypes,
                "bounds": [src.bounds.left, src.bounds.bottom, src.bounds.right, src.bounds.top]
            }
        return Status.EXTRACTED, {"metadata": meta}
    except Exception as e:
        return Status.UNRESOLVED, {"reason": str(e)}

def extract_vector_metadata(file_path: Path):
    if not PYSHP_AVAILABLE:
        return Status.UNRESOLVED, {"reason": "pyshp unavailable"}
        
    if file_path.suffix.lower() != ".shp":
        return Status.UNRESOLVED, {"reason": "Only .shp supported via pyshp fallback"}
        
    try:
        sf = shapefile.Reader(str(file_path))
        meta = {
            "shapeType": sf.shapeTypeName,
            "numRecords": len(sf),
            "bbox": sf.bbox,
            "fields": [f[0] for f in sf.fields[1:]]
        }
        return Status.EXTRACTED, {"metadata": meta}
    except Exception as e:
        return Status.UNRESOLVED, {"reason": str(e)}

def extract_structured_data(file_path: Path):
    # Mostly to check for information loss in JSON
    if file_path.suffix.lower() == ".json":
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return Status.EXTRACTED, {"keys_found": len(data) if isinstance(data, dict) else len(data)}
        except Exception as e:
            return Status.UNRESOLVED, {"reason": str(e)}
    elif file_path.suffix.lower() == ".csv":
        try:
            df = pd.read_csv(file_path)
            return Status.EXTRACTED, {"rows_found": len(df)}
        except Exception as e:
            return Status.UNRESOLVED, {"reason": str(e)}
            
    return Status.NOT_APPLICABLE, {}
