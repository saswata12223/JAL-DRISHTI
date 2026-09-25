import pandas as pd
from pathlib import Path

def main():
    repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
    
    # 1. Load temporal coverage
    temp_csv = repo_root / "data" / "processed" / "catalog" / "TEMPORAL_COVERAGE.csv"
    if not temp_csv.exists():
        print("TEMPORAL_COVERAGE.csv not found.")
        return
        
    df_temp = pd.read_csv(temp_csv)
    
    # Check if there's any continuous rainfall source
    rainfall_sources = df_temp[df_temp['filename'].str.contains('rain|weather|gpm|nc4', case=False, na=False)]
    
    events_files = df_temp[df_temp['filename'].str.contains('event', case=False, na=False)]
    
    report_lines = []
    report_lines.append("# Phase 9: Event / Rainfall Temporal Relationship Analysis\n")
    report_lines.append("## Rainfall Sources Found in Temporal Audit")
    
    continuous_rainfall_found = False
    for idx, row in rainfall_sources.iterrows():
        try:
            start = pd.to_datetime(row['start'])
            end = pd.to_datetime(row['end'])
            days = (end - start).days
            report_lines.append(f"- **{row['filename']}**: start={start.date()}, end={end.date()}, days={days}, timestep={row['native_timestep']}")
            if days > 30: # more than a month implies it might be continuous rather than just a few event days
                continuous_rainfall_found = True
        except:
            report_lines.append(f"- **{row['filename']}**: temporal bounds could not be parsed.")
            
    report_lines.append("\n## Events Found")
    for idx, row in events_files.iterrows():
        report_lines.append(f"- **{row['filename']}**: {row['start']} to {row['end']}")
        
    report_lines.append("\n## Conclusion")
    if continuous_rainfall_found:
        report_lines.append("The raw data DOES contain continuous rainfall/weather sources that span long periods (>30 days). ")
        report_lines.append("Therefore, the V0.3 conclusion that 'there are no non-event rainfall observations' is LIKELY INCORRECT when considering the entirety of data/raw.")
        report_lines.append("We can construct negative examples from these continuous periods.")
    else:
        report_lines.append("All discovered rainfall sources appear to be temporally limited or event-centered.")
        report_lines.append("The V0.3 conclusion that 'there are no non-event rainfall observations' appears CORRECT based on the currently available raw data.")
        
    out_md = repo_root / "data" / "processed" / "catalog" / "EVENTS_ANALYSIS.md"
    with open(out_md, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    print(f"Phase 9 complete. Analysis saved to {out_md}")

if __name__ == "__main__":
    main()
