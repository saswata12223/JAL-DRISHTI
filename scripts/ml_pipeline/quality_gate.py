
import os
import time
from pathlib import Path
import pandas as pd

def run_gate(repo_root, budget, manager, args):
    print("Running quality gate...")
    canon_dir = Path(repo_root) / "data" / "processed" / "canonical"
    
    datasets = ["precipitation.parquet", "soil_moisture.parquet", "flood_events.parquet", "terrain.parquet", "land_cover.parquet"]
    
    stats = []
    for ds in datasets:
        p = canon_dir / ds
        if p.exists():
            df = pd.read_parquet(p)
            stats.append({
                "dataset": ds,
                "row_count": len(df),
                "null_count": df.isna().sum().sum(),
                "duplicate_count": df.duplicated().sum()
            })
            
    report_df = pd.DataFrame(stats)
    report_df.to_csv(canon_dir / "data_quality_report.csv", index=False)
    
    with open(canon_dir / "DATA_COVERAGE_REPORT.md", "w") as f:
        f.write("# Data Coverage Report\n\n")
        f.write(report_df.to_markdown())
        
    return True
