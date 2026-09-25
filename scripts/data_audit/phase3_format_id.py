import pandas as pd
import filetype
import os
import hashlib
from pathlib import Path
import json

def get_sha256(filepath):
    sha256_hash = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except Exception as e:
        return f"ERROR: {str(e)}"

def check_readable(filepath, ext):
    try:
        if ext in ['.csv']:
            df = pd.read_csv(filepath, nrows=5)
            return True, "pandas", list(df.columns)
        elif ext in ['.parquet']:
            df = pd.read_parquet(filepath)
            return True, "pandas", list(df.columns)
        elif ext in ['.json']:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            schema = type(data).__name__
            if isinstance(data, dict):
                schema = list(data.keys())
            return True, "json", schema
        return False, "N/A", None
    except Exception as e:
        return False, "N/A", str(e)

def main():
    repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
    manifest_csv = repo_root / "data" / "raw" / "_manifest" / "raw_inventory_before.csv"
    
    if not manifest_csv.exists():
        print("Manifest not found. Run Phase 1 first.")
        return
        
    df = pd.read_csv(manifest_csv)
    raw_files = df[df['source_category'] == 'raw'].copy()
    
    results = []
    
    for idx, row in raw_files.iterrows():
        filepath = Path(row['absolute_path'])
        ext = row['extension'].lower()
        size = row['size']
        sha256 = row['sha256']
        
        detected_format = "unknown"
        if filepath.exists():
            kind = filetype.guess(filepath)
            if kind:
                detected_format = kind.extension
            else:
                # Fallbacks for text formats
                if ext in ['.csv', '.txt', '.md', '.json', '.xml']:
                    detected_format = ext.replace('.', '')
        
        readable, parser, schema = check_readable(filepath, ext)
        
        results.append({
            "filename": row['filename'],
            "absolute_path": row['absolute_path'],
            "extension": ext,
            "detected_format": detected_format,
            "readable": readable,
            "parser_used": parser,
            "schema": str(schema) if schema else "",
            "size": size,
            "sha256": sha256
        })
        
    out_dir = repo_root / "data" / "processed" / "catalog"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_csv = out_dir / "PHASE3_FORMAT_IDENTIFICATION.csv"
    
    results_df = pd.DataFrame(results)
    results_df.to_csv(out_csv, index=False)
    print(f"Phase 3 complete. Results saved to {out_csv}")

if __name__ == "__main__":
    main()
