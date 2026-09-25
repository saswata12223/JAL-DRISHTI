import re
import fitz
from pathlib import Path
from .config import Status, ContentType

DOMAIN_TERMS = [
    r"\brainfall\b", r"\bprecipitation\b", r"\bcloudburst\b", r"\bflood\b", r"\bflash flood\b",
    r"\bwater level\b", r"\bdischarge\b", r"\bHFL\b", r"\bLWL\b", r"\bdanger level\b",
    r"\bwarning level\b", r"\bdam\b", r"\breservoir\b", r"\bstorage\b", r"\bspillway\b",
    r"\bcatchment\b", r"\bwatershed\b", r"\bbasin\b", r"\brunoff\b", r"\briver\b",
    r"\bhydrograph\b", r"\bcross section\b", r"\belevation\b", r"\blandslide\b",
    r"\bdebris\b", r"\bsediment\b"
]

def extract_entities_from_text(text: str):
    found = []
    for term in DOMAIN_TERMS:
        # Very simple regex match, case insensitive
        matches = re.finditer(term, text, re.IGNORECASE)
        for m in matches:
            found.append({
                "entity": m.group(0),
                "context": text[max(0, m.start()-30):min(len(text), m.end()+30)].replace('\n', ' ')
            })
    return found

def audit_nlp(file_path: Path):
    """
    Extracts domain entities from PDF plain text.
    """
    if file_path.suffix.lower() != ".pdf":
        return {"error": None, "entities": []}
        
    entities = []
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            if text:
                found = extract_entities_from_text(text)
                for f in found:
                    entities.append({
                        "page": page_num + 1,
                        "entity": f["entity"],
                        "context": f["context"]
                    })
        doc.close()
    except Exception as e:
        return {"error": str(e), "entities": []}
        
    return {"error": None, "entities": entities}
