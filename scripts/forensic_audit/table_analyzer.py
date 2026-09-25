import pdfplumber
from pathlib import Path
from .config import Status

def extract_tables(file_path: Path):
    """
    Attempts table extraction using pdfplumber.
    Returns status and metrics.
    """
    extracted_tables = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                # Try finding tables
                tables = page.find_tables()
                for i, table in enumerate(tables):
                    extracted_data = table.extract()
                    if not extracted_data:
                        status = Status.DETECTED_BUT_NOT_DIGITIZED
                        reason = "Empty extraction"
                    else:
                        # Basic check: do we have headers and rows?
                        if len(extracted_data) > 1 and len(extracted_data[0]) > 1:
                            status = Status.EXTRACTED
                            reason = "Table extracted successfully"
                        else:
                            status = Status.PARTIALLY_EXTRACTED
                            reason = "Degraded table structure"
                    
                    extracted_tables.append({
                        "page": page_num + 1,
                        "table_id": i,
                        "status": status,
                        "reason": reason,
                        "row_count": len(extracted_data) if extracted_data else 0
                    })
    except Exception as e:
        return {"error": str(e), "tables": []}
        
    return {"error": None, "tables": extracted_tables}
