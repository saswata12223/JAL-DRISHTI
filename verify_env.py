import sys
import json
import subprocess
import importlib.util

def check_pkg(pkg_name):
    return importlib.util.find_spec(pkg_name) is not None

def check_cmd(cmd):
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False

env = {
    "Python": sys.version,
    "PyMuPDF": "AVAILABLE" if check_pkg("fitz") else "UNAVAILABLE",
    "pdfplumber": "AVAILABLE" if check_pkg("pdfplumber") else "UNAVAILABLE",
    "Camelot": "AVAILABLE" if check_pkg("camelot") else "UNAVAILABLE",
    "Pillow": "AVAILABLE" if check_pkg("PIL") else "UNAVAILABLE",
    "OpenCV": "AVAILABLE" if check_pkg("cv2") else "UNAVAILABLE",
    "pandas": "AVAILABLE" if check_pkg("pandas") else "UNAVAILABLE",
    "numpy": "AVAILABLE" if check_pkg("numpy") else "UNAVAILABLE",
    "rasterio": "AVAILABLE" if check_pkg("rasterio") else "UNAVAILABLE",
    "geopandas": "AVAILABLE" if check_pkg("geopandas") else "UNAVAILABLE",
    "shapely": "AVAILABLE" if check_pkg("shapely") else "UNAVAILABLE",
    "pyogrio": "AVAILABLE" if check_pkg("pyogrio") else "UNAVAILABLE",
    
    # System deps
    "Tesseract_Executable": "AVAILABLE" if check_cmd(["tesseract", "--version"]) else "UNAVAILABLE",
    "Ghostscript_Executable": "AVAILABLE" if check_cmd(["gs", "--version"]) or check_cmd(["gswin64c", "--version"]) else "UNAVAILABLE",
    "GDAL_Executable": "AVAILABLE" if check_cmd(["gdalinfo", "--version"]) else "UNAVAILABLE",
}

print(json.dumps(env, indent=2))
