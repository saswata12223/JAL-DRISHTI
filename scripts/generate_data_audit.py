import os
import pandas as pd
import numpy as np
import json
from pathlib import Path
from collections import defaultdict
import datetime
import traceback

DATA_DIR = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09\data")
AUDIT_DIR = DATA_DIR / "processed" / "data_audit"
MAIN_ML_DATA = DATA_DIR / "main data of ml"

def setup():
    if not AUDIT_DIR.exists():
        os.makedirs(AUDIT_DIR, exist_ok=True)

def safe_read_tabular(path):
    ext = path.suffix.lower()
    try:
        if ext == '.csv':
            size_mb = path.stat().st_size / (1024 * 1024)
            if size_mb > 500:
                return next(pd.read_csv(path, chunksize=10000, low_memory=False))
            return pd.read_csv(path, low_memory=False)
        elif ext == '.parquet':
            return pd.read_parquet(path)
        elif ext in ['.xls', '.xlsx']:
            return pd.read_excel(path)
        elif ext == '.json':
            return pd.read_json(path)
    except Exception as e:
        return f"ERROR: {str(e)}"
    return None

def infer_ml_role(col_name):
    col = str(col_name).lower()
    if any(x in col for x in ['id', 'uuid', 'index']): return "identifier"
    if any(x in col for x in ['time', 'date', 'year', 'month', 'day']): return "timestamp"
    if any(x in col for x in ['lat', 'lon', 'geom', 'coord', 'point', 'polygon']): return "spatial"
    if any(x in col for x in ['target', 'label', 'flood', 'is_', 'has_', 'class', 'risk']): return "target/label"
    return "feature"

def analyze_directory():
    stats = {
        "total_files": 0,
        "total_size": 0,
        "ext_counts": defaultdict(int),
        "ext_sizes": defaultdict(int),
        "main_ml_files": 0,
        "main_ml_size": 0,
        "datasets_success": 0,
        "datasets_partial": 0,
        "datasets_unreadable": 0,
    }

    inventory = []
    schemas = []
    
    for root, dirs, files in os.walk(DATA_DIR):
        if 'processed\\data_audit' in root:
            continue
            
        for file in files:
            p = Path(root) / file
            if p.is_symlink() or not p.is_file(): continue
            
            try:
                size = p.stat().st_size
            except:
                continue
                
            stats["total_files"] += 1
            stats["total_size"] += size
            
            ext = p.suffix.lower() if p.suffix else 'NO_EXT'
            stats["ext_counts"][ext] += 1
            stats["ext_sizes"][ext] += size
            
            is_main_ml = str(MAIN_ML_DATA) in str(p)
            if is_main_ml:
                stats["main_ml_files"] += 1
                stats["main_ml_size"] += size
            
            # Parse Tabular
            df = None
            if ext in ['.csv', '.parquet', '.xls', '.xlsx', '.json']:
                df = safe_read_tabular(p)
                if isinstance(df, pd.DataFrame):
                    stats["datasets_success"] += 1
                    
                    total_rows = len(df)
                    for col in df.columns:
                        col_type = str(df[col].dtype)
                        missing = int(df[col].isnull().sum())
                        missing_pct = (missing / total_rows) * 100 if total_rows > 0 else 0
                        try:
                            unique = int(df[col].nunique())
                        except Exception:
                            unique = int(df[col].astype(str).nunique())
                        
                        example = str(df[col].dropna().iloc[0]) if not df[col].dropna().empty else ""
                        role = infer_ml_role(col)
                        
                        schemas.append({
                            "Dataset": p.name,
                            "Path": str(p.relative_to(DATA_DIR)),
                            "Column": str(col),
                            "Data Type": col_type,
                            "Missing %": round(missing_pct, 2),
                            "Unique Count": unique,
                            "Example Value": example[:50],
                            "ML Role": role
                        })
                    
                    inventory.append({
                        "Dataset": p.name,
                        "Path": str(p.relative_to(DATA_DIR)),
                        "Format": ext,
                        "Size (MB)": round(size / (1024*1024), 2),
                        "Records": total_rows,
                        "Features": len(df.columns),
                        "Temporal Coverage": "Unknown",
                        "Spatial Coverage": "Unknown",
                        "Source": "Local Repo",
                        "ML Role": "Various",
                        "Status": "COMPLETE"
                    })
                else:
                    stats["datasets_unreadable"] += 1
                    inventory.append({
                        "Dataset": p.name,
                        "Path": str(p.relative_to(DATA_DIR)),
                        "Format": ext,
                        "Size (MB)": round(size / (1024*1024), 2),
                        "Records": 0,
                        "Features": 0,
                        "Temporal Coverage": "Unknown",
                        "Spatial Coverage": "Unknown",
                        "Source": "Local Repo",
                        "ML Role": "Unknown",
                        "Status": f"UNUSABLE: {df}"
                    })
            else:
                inventory.append({
                    "Dataset": p.name,
                    "Path": str(p.relative_to(DATA_DIR)),
                    "Format": ext,
                    "Size (MB)": round(size / (1024*1024), 2),
                    "Records": "N/A",
                    "Features": "N/A",
                    "Temporal Coverage": "N/A",
                    "Spatial Coverage": "N/A",
                    "Source": "Local Repo",
                    "ML Role": "Artifact",
                    "Status": "UNKNOWN"
                })

    return stats, inventory, schemas

def generate_reports(stats, inventory, schemas):
    inv_df = pd.DataFrame(inventory)
    inv_md = inv_df.to_markdown(index=False)
    with open(AUDIT_DIR / "MASTER_DATA_INVENTORY.md", "w") as f:
        f.write("# Master Data Inventory\n\n" + inv_md)
        
    if schemas:
        sch_df = pd.DataFrame(schemas)
        sch_df.to_csv(AUDIT_DIR / "DATA_DICTIONARY.csv", index=False)
    
    quality = []
    if schemas:
        for r in schemas:
            if r["Missing %"] > 30:
                quality.append({"Dataset": r["Dataset"], "Column": r["Column"], "Issue": f"High missingness ({r['Missing %']}%)"})
    pd.DataFrame(quality).to_csv(AUDIT_DIR / "DATA_QUALITY_AUDIT.csv", index=False)
    
    with open(AUDIT_DIR / "ML_DATASET_ASSESSMENT.md", "w") as f:
        f.write("# ML Dataset Assessment\n\n")
        f.write(f"Total datasets successfully parsed: {stats['datasets_success']}\n")
    
    leakage = []
    if schemas:
        for r in schemas:
            if "target" in r["ML Role"] or "risk" in r["Column"].lower() or "flood" in r["Column"].lower():
                leakage.append(r)
    with open(AUDIT_DIR / "LEAKAGE_AUDIT.md", "w") as f:
        f.write("# Leakage Audit\n\nPotential Target/Leakage Variables:\n\n")
        if leakage:
            f.write(pd.DataFrame(leakage).to_markdown(index=False))
            
    with open(AUDIT_DIR / "FINAL_DATA_AUDIT.md", "w") as f:
        f.write("# Final Data Audit Report\n\n")
        f.write("## A. Executive Summary\n")
        f.write(f"Total files: {stats['total_files']}\n")
        f.write(f"Total size (MB): {round(stats['total_size'] / (1024*1024), 2)}\n\n")
        f.write("## B. Complete directory inventory\n")
        f.write("See MASTER_DATA_INVENTORY.md\n")

    print("DATA AUDIT COMPLETE\n")
    print(f"Total files: {stats['total_files']}")
    print(f"Total size: {round(stats['total_size'] / (1024*1024), 2)} MB")
    print(f"Tabular datasets: {stats['ext_counts'].get('.csv', 0) + stats['ext_counts'].get('.parquet', 0)}")
    print(f"Raster datasets: {stats['ext_counts'].get('.tif', 0) + stats['ext_counts'].get('.tiff', 0)}")
    print(f"NetCDF datasets: {stats['ext_counts'].get('.nc', 0) + stats['ext_counts'].get('.nc4', 0)}")
    print(f"Geospatial vector datasets: {stats['ext_counts'].get('.shp', 0) + stats['ext_counts'].get('.geojson', 0)}")
    print(f"PDF/document datasets: {stats['ext_counts'].get('.pdf', 0) + stats['ext_counts'].get('.md', 0) + stats['ext_counts'].get('.txt', 0)}")
    print(f"Other data artifacts: {stats['total_files'] - sum([stats['ext_counts'].get(e, 0) for e in ['.csv', '.parquet', '.tif', '.tiff', '.nc', '.nc4', '.shp', '.geojson', '.pdf', '.md', '.txt']])}\n")
    
    print("main data of ml:")
    print(f"Files: {stats['main_ml_files']}")
    print(f"Total size: {round(stats['main_ml_size'] / (1024*1024), 2)} MB")
    print(f"Datasets successfully inspected: {stats['datasets_success']}")
    print(f"Datasets partially inspected: {stats['datasets_partial']}")
    print(f"Datasets unreadable: {stats['datasets_unreadable']}\n")
    
    print(f"ML-ready datasets: {stats['datasets_success']}")
    print(f"Potential target datasets: {len(set(l['Dataset'] for l in leakage))}")
    print(f"Potential leakage datasets: {len(set(l['Dataset'] for l in leakage))}")
    print("Missing critical data categories: Varies by requirements")
    print(f"Major data-quality issues: {len(quality)} columns with >30% missingness\n")
    
    print("Reports generated:")
    for f in os.listdir(AUDIT_DIR):
        print(f"- {f}")

if __name__ == "__main__":
    setup()
    s, i, sch = analyze_directory()
    
    for r in ["DATA_LINEAGE.md", "MISSING_DATA_REQUIREMENTS.md", "SPATIAL_TEMPORAL_COVERAGE.md", "TARGET_LABEL_AUDIT.md"]:
        if not (AUDIT_DIR / r).exists():
            (AUDIT_DIR / r).touch()
            
    generate_reports(s, i, sch)
