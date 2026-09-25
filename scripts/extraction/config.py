import os
from pathlib import Path

# Paths
PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed" / "extraction"

# Extraction Subdirectories
DIRS = {
    "manifest": PROCESSED_DIR / "manifest",
    "text": PROCESSED_DIR / "text",
    "tables": PROCESSED_DIR / "tables",
    "json": PROCESSED_DIR / "json",
    "csv": PROCESSED_DIR / "csv",
    "geospatial": PROCESSED_DIR / "geospatial",
    "raster": PROCESSED_DIR / "raster",
    "images": PROCESSED_DIR / "images",
    "ocr": PROCESSED_DIR / "ocr",
    "metadata": PROCESSED_DIR / "metadata",
    "diagnostics": PROCESSED_DIR / "diagnostics",
    "failed": PROCESSED_DIR / "failed",
    "reports": PROCESSED_DIR / "reports",
}

# DB Config
DB_PATH = PROCESSED_DIR / "extraction_catalog.sqlite"

# Ensure all directories exist
def init_directories():
    for d in DIRS.values():
        d.mkdir(parents=True, exist_ok=True)
