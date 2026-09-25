import pandas as pd
from pathlib import Path

def main():
    repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
    manifest_csv = repo_root / "data" / "raw" / "_manifest" / "raw_inventory_before.csv"
    
    if not manifest_csv.exists():
        print("Manifest not found.")
        return
        
    df = pd.read_csv(manifest_csv)
    raw_files = df[df['source_category'] == 'raw'].copy()
    
    duplicates = []
    
    # EXACT_DUPLICATE based on SHA256
    hash_counts = raw_files['sha256'].value_counts()
    exact_dupes_hashes = hash_counts[hash_counts > 1].index
    
    for h in exact_dupes_hashes:
        group = raw_files[raw_files['sha256'] == h]
        paths = group['absolute_path'].tolist()
        for p in paths:
            duplicates.append({
                "file": p,
                "classification": "EXACT_DUPLICATE",
                "related_files": str([x for x in paths if x != p])
            })
            
    # FORMAT_EQUIVALENT (same stem, different extension like .csv vs .parquet)
    # create a stem column
    raw_files['stem'] = raw_files['absolute_path'].apply(lambda x: Path(x).stem)
    stem_counts = raw_files['stem'].value_counts()
    format_dupes_stems = stem_counts[stem_counts > 1].index
    
    for s in format_dupes_stems:
        group = raw_files[raw_files['stem'] == s]
        # Ignore if they were already marked as exact duplicate
        paths = group['absolute_path'].tolist()
        for p in paths:
            if not any(d['file'] == p and d['classification'] == 'EXACT_DUPLICATE' for d in duplicates):
                duplicates.append({
                    "file": p,
                    "classification": "FORMAT_EQUIVALENT",
                    "related_files": str([x for x in paths if x != p])
                })
                
    # Extracted ZIP vs archive equivalents (simplified heuristic)
    for idx, row in raw_files.iterrows():
        if row['extension'].lower() == '.zip':
            stem = Path(row['absolute_path']).stem
            # if a folder or files exist with that stem in raw, it's extracted
            duplicates.append({
                "file": row['absolute_path'],
                "classification": "UNKNOWN / ARCHIVE",
                "related_files": "Check manually for extracted contents"
            })

    out_dir = repo_root / "data" / "processed" / "catalog"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_csv = out_dir / "DUPLICATE_REPORT.csv"
    
    if duplicates:
        pd.DataFrame(duplicates).to_csv(out_csv, index=False)
        print(f"DUPLICATE_REPORT.csv saved with {len(duplicates)} items.")
    else:
        pd.DataFrame(columns=["file", "classification", "related_files"]).to_csv(out_csv, index=False)
        print("No duplicates found, empty DUPLICATE_REPORT.csv saved.")
        
if __name__ == "__main__":
    main()
