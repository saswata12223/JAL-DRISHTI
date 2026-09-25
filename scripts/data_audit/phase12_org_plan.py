import pandas as pd
from pathlib import Path
import collections

def guess_category(filepath_str):
    lower = filepath_str.lower()
    if 'srtm' in lower or 'terrain' in lower:
        return 'terrain/srtm'
    if 'landcover' in lower or 'lccs' in lower:
        return 'landcover'
    if 'smap' in lower or 'soil_moisture' in lower:
        return 'soil_moisture/smap'
    if 'gpm' in lower or 'imerg' in lower or 'rainfall' in lower or '3b-hhr' in lower:
        return 'rainfall/gpm'
    if 'weather' in lower or 'imd' in lower:
        return 'weather'
    if 'waterlevel' in lower or 'cwc' in lower:
        return 'waterlevel'
    if 'event' in lower or 'flood' in lower:
        return 'events'
    if 'boundary' in lower or 'hydrobassin' in lower or 'admin' in lower:
        return 'reference/boundaries'
    return 'other'

def main():
    repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
    manifest_csv = repo_root / "data" / "raw" / "_manifest" / "raw_inventory_before.csv"
    
    if not manifest_csv.exists():
        print("Manifest not found.")
        return
        
    df = pd.read_csv(manifest_csv)
    raw_files = df[df['source_category'] == 'raw']
    
    # Group by stem to find companion files
    bundles = collections.defaultdict(list)
    for idx, row in raw_files.iterrows():
        filepath = Path(row['absolute_path'])
        stem = filepath.stem
        # if it's a known extension that usually has companions
        if row['extension'].lower() in ['.shp', '.shx', '.dbf', '.prj', '.sbn', '.sbx', '.cpg', '.xml', '.tif', '.tfw', '.hdr', '.csv', '.parquet']:
            bundles[stem].append(row)
        else:
            bundles[filepath.name].append(row)
            
    report_lines = ["# Phase 12: Raw Organization Plan\n"]
    report_lines.append("*NOTE: This is a mapping plan only. No physical files have been moved yet.*\n")
    
    report_lines.append("| Current Path | Proposed Destination | Category | Companion Files | SHA-256 | Move Safety |")
    report_lines.append("|---|---|---|---|---|---|")
    
    for bundle_name, files in bundles.items():
        # decide category based on the first file
        category = guess_category(files[0]['relative_path'])
        
        # companions
        companions = [f['filename'] for f in files]
        
        for f in files:
            current_path = Path(f['relative_path']).as_posix()
            proposed_dest = f"data/raw/{category}/{f['filename']}"
            sha256 = f['sha256']
            safety = "SAFE" if len(files) == 1 else "SAFE (Bundle)"
            
            # format for table
            report_lines.append(f"| `{current_path}` | `{proposed_dest}` | {category} | {len(companions)} files | `{sha256[:8]}...` | {safety} |")

    out_md = repo_root / "data" / "processed" / "catalog" / "RAW_ORGANIZATION_PLAN.md"
    with open(out_md, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    print(f"Phase 12 complete. Plan saved to {out_md}")

if __name__ == "__main__":
    main()
