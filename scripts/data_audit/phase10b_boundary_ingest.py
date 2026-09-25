import os
import shutil
import hashlib
from pathlib import Path
import xml.etree.ElementTree as ET
from datetime import datetime

def get_sha256(filepath):
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def main():
    repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
    source_dir = repo_root / "data" / "raw" / "New_data_geo" / "File_660546_0d88b2334e4942f3bee06edcd81abfed" / "05"
    dest_base = repo_root / "data" / "raw" / "reference_boundaries" / "uttarakhand"
    dest_source = dest_base / "source"
    
    os.makedirs(dest_source, exist_ok=True)
    
    # 1. Hashes of original files
    original_files = []
    for f in source_dir.iterdir():
        if f.is_file() and (f.name.startswith("UTTARAKHAND_STATE_BDY") or f.name.startswith("UTTARAKHAND_DISTRICT_BDY")):
            original_files.append(f)
            
    hash_map_original = {}
    for f in original_files:
        hash_map_original[f.name] = get_sha256(f)
        
    # 2. Copy files securely
    for f in original_files:
        dest_path = dest_source / f.name
        if not dest_path.exists():
            shutil.copy2(f, dest_path)
            
    # 3. Hash preserved files and verify
    hash_map_preserved = {}
    for f in dest_source.iterdir():
        if f.is_file():
            hash_map_preserved[f.name] = get_sha256(f)
            
    # Verify match
    mismatches = 0
    for name, orig_hash in hash_map_original.items():
        if orig_hash != hash_map_preserved.get(name):
            mismatches += 1
            print(f"HASH MISMATCH: {name}")
            
    if mismatches > 0:
        print("STOP: SHA256 mismatches detected during boundary ingest!")
        return
        
    # 4. Write SHA256SUMS.txt
    with open(dest_base / "SHA256SUMS.txt", "w", encoding="utf-8") as f:
        f.write("# Original Artifact Hashes\n")
        for name, h in hash_map_original.items():
            f.write(f"SHA256 {name} {h}\n")
        f.write("\n# Preserved Artifact Hashes\n")
        for name, h in hash_map_preserved.items():
            f.write(f"SHA256 {name} {h}\n")
            
    # 5. Extract metadata from XML to determine Provenance
    xml_path = source_dir / "UTTARAKHAND_STATE_BDY.shp.xml"
    
    provider = "NOT AVAILABLE FROM SUPPLIED SOURCE"
    source_agency = "NOT AVAILABLE FROM SUPPLIED SOURCE"
    lineage = "NOT AVAILABLE FROM SUPPLIED SOURCE"
    provenance = "UNVERIFIED"
    
    if xml_path.exists():
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()
            # Simple heuristic since namespaces can be messy: look for lineage string
            xml_text = open(xml_path, "r", encoding="utf-8", errors="ignore").read()
            if "SOI_ORGI_SJ_FINAL" in xml_text or "ABDB" in xml_text:
                provider = "Survey of India / ORGI"
                source_agency = "Survey of India (SOI) / Office of the Registrar General of India (ORGI)"
                lineage = "Derived from ABDB (Administrative Boundary Database) joining SOI & ORGI data"
                provenance = "AUTHORITATIVE — PRIORITY 1"
        except Exception as e:
            print("XML parse error:", e)
            
    # Write SOURCE_METADATA.md
    with open(dest_base / "SOURCE_METADATA.md", "w", encoding="utf-8") as f:
        f.write(f"""# Uttarakhand Administrative Boundary — Source Metadata

Provider: {provider}
Dataset: Administrative Boundary Database (ABDB) Extract
Product: State and District Boundaries
Administrative Level: State, District
Source Agency: {source_agency}
Source URL: NOT AVAILABLE IN SUPPLIED METADATA
Exact Download URL: NOT AVAILABLE IN SUPPLIED METADATA
Publication Date: NOT AVAILABLE FROM SUPPLIED SOURCE
Version: NOT AVAILABLE FROM SUPPLIED SOURCE
Metadata Date: 20251016 (From XML SyncDate)
Original Local Path: {source_dir}
Preserved Source Path: {dest_source}
Acquisition Method: Provided directly via local ingest
Original CRS: LCC_WGS84 (Projected)
SHA-256: (See SHA256SUMS.txt)
License: NOT AVAILABLE FROM SUPPLIED SOURCE
Lineage: {lineage}
Provenance Classification: {provenance}
Notes: Official Survey of India administrative boundary products reference page: https://onlinemaps.surveyofindia.gov.in/Digital_Products.aspx (SOURCE PRODUCT REFERENCE ONLY)
""")
    
    print("Ingest complete. Validated SHA256 matches.")
    
if __name__ == "__main__":
    main()
