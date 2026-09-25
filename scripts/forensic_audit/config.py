import os
from pathlib import Path

# Paths
PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed" / "forensic_extraction"

DIRS = {
    "manifest": PROCESSED_DIR / "manifest",
    "text": PROCESSED_DIR / "text",
    "tables": PROCESSED_DIR / "tables",
    "images": PROCESSED_DIR / "images",
    "metadata": PROCESSED_DIR / "metadata",
    "reports": PROCESSED_DIR / "reports",
}

DB_PATH = PROCESSED_DIR / "forensic_catalog.sqlite"

def init_directories():
    for d in DIRS.values():
        d.mkdir(parents=True, exist_ok=True)

# Status Enums
class Status:
    EXTRACTED = "EXTRACTED"
    PARTIALLY_EXTRACTED = "PARTIALLY_EXTRACTED"
    DETECTED_BUT_NOT_DIGITIZED = "DETECTED_BUT_NOT_DIGITIZED"
    UNRESOLVED = "UNRESOLVED"
    NOT_APPLICABLE = "NOT_APPLICABLE"

# Content Types
class ContentType:
    NATIVE_TEXT = "native_text"
    SCANNED_TEXT = "scanned_text"
    TABLE = "table"
    SCANNED_TABLE = "scanned_table"
    EMBEDDED_IMAGE = "embedded_image"
    MAP = "map"
    CHART = "chart"
    HYDROGRAPH = "hydrograph"
    RAINFALL_GRAPH = "rainfall_graph"
    CROSS_SECTION = "cross_section"
    ENGINEERING_DRAWING = "engineering_drawing"
    PHOTOGRAPH = "photograph"
    DIAGRAM = "diagram"
    RASTER = "raster"
    VECTOR = "vector"
    METADATA = "metadata"
    DOMAIN_ENTITY = "domain_entity"
