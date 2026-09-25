import pandas as pd
import xarray as xr
from pathlib import Path
import json

def inspect_csv_temporal(filepath, filename):
    try:
        df = pd.read_csv(filepath)
        time_cols = [c for c in df.columns if 'time' in c.lower() or 'date' in c.lower()]
        
        if not time_cols:
            return {"filename": filename, "temporal": False}
            
        time_col = time_cols[0]
        # try to convert to datetime
        try:
            df[time_col] = pd.to_datetime(df[time_col], errors='coerce')
            df = df.dropna(subset=[time_col])
        except:
            pass
            
        if not pd.api.types.is_datetime64_any_dtype(df[time_col]):
            return {"filename": filename, "temporal": False}
            
        start = df[time_col].min()
        end = df[time_col].min()
        unique_times = df[time_col].nunique()
        total_rows = len(df)
        duplicates = total_rows - unique_times
        
        # approximate timestep
        df = df.sort_values(by=time_col)
        diffs = df[time_col].diff().dropna()
        if len(diffs) > 0:
            timestep = str(diffs.mode()[0])
        else:
            timestep = "None"
            
        return {
            "filename": filename,
            "temporal": True,
            "start": str(start),
            "end": str(end),
            "native_timestep": timestep,
            "timezone": "UNKNOWN / NEEDS VERIFICATION",
            "observation_vs_forecast": "UNKNOWN / NEEDS VERIFICATION",
            "duplicate_timestamps": duplicates,
            "status": "SUCCESS"
        }
    except Exception as e:
        return {"filename": filename, "temporal": False, "status": f"ERROR: {str(e)}"}

def inspect_nc4_temporal(filepath, filename):
    try:
        ds = xr.open_dataset(filepath, engine='netcdf4', chunks={})
        if 'time' not in ds.coords:
            ds.close()
            return {"filename": filename, "temporal": False}
            
        time_coord = ds['time']
        start = time_coord.min().values
        end = time_coord.max().values
        
        diffs = pd.Series(time_coord.values).diff().dropna()
        timestep = str(diffs.mode()[0]) if len(diffs) > 0 else "None"
        
        ds.close()
        
        return {
            "filename": filename,
            "temporal": True,
            "start": str(start),
            "end": str(end),
            "native_timestep": timestep,
            "timezone": "UTC (Assumed) / NEEDS VERIFICATION",
            "observation_vs_forecast": "UNKNOWN / NEEDS VERIFICATION",
            "duplicate_timestamps": "UNKNOWN",
            "status": "SUCCESS"
        }
    except Exception as e:
        return {"filename": filename, "temporal": False, "status": f"ERROR: {str(e)}"}

def main():
    repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
    manifest_csv = repo_root / "data" / "raw" / "_manifest" / "raw_inventory_before.csv"
    
    if not manifest_csv.exists():
        print("Manifest not found.")
        return
        
    df = pd.read_csv(manifest_csv)
    raw_files = df[df['source_category'] == 'raw']
    
    temporal_results = []
    semantic_results = []
    
    for idx, row in raw_files.iterrows():
        ext = row['extension'].lower()
        filepath = Path(row['absolute_path'])
        filename = row['filename']
        dataset_name = row['relative_path']
        
        if ext == '.csv':
            res = inspect_csv_temporal(filepath, filename)
            if res.get('temporal'):
                temporal_results.append(res)
            # Semantics (Best effort)
            try:
                temp_df = pd.read_csv(filepath, nrows=0)
                for col in temp_df.columns:
                    semantic_results.append({
                        "dataset": dataset_name,
                        "variable": col,
                        "actual_meaning": "UNKNOWN / NEEDS VERIFICATION",
                        "units": "UNKNOWN / NEEDS VERIFICATION",
                        "native_resolution": "UNKNOWN",
                        "source": "UNKNOWN",
                        "confidence": "UNKNOWN",
                        "model_role": "UNKNOWN / NEEDS VERIFICATION"
                    })
            except:
                pass
                
        elif ext in ['.nc', '.nc4']:
            res = inspect_nc4_temporal(filepath, filename)
            if res.get('temporal'):
                temporal_results.append(res)
            try:
                ds = xr.open_dataset(filepath, engine='netcdf4', chunks={})
                for v in ds.data_vars:
                    var_obj = ds[v]
                    semantic_results.append({
                        "dataset": dataset_name,
                        "variable": v,
                        "actual_meaning": var_obj.attrs.get('long_name', 'UNKNOWN / NEEDS VERIFICATION'),
                        "units": var_obj.attrs.get('units', 'UNKNOWN / NEEDS VERIFICATION'),
                        "native_resolution": "UNKNOWN",
                        "source": ds.attrs.get('institution', 'UNKNOWN'),
                        "confidence": "UNKNOWN",
                        "model_role": "UNKNOWN / NEEDS VERIFICATION"
                    })
                ds.close()
            except:
                pass
            
    out_dir = repo_root / "data" / "processed" / "catalog"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    if temporal_results:
        pd.DataFrame(temporal_results).to_csv(out_dir / "TEMPORAL_COVERAGE.csv", index=False)
        print("TEMPORAL_COVERAGE.csv saved.")
    
    if semantic_results:
        pd.DataFrame(semantic_results).to_csv(out_dir / "VARIABLE_DICTIONARY.csv", index=False)
        print("VARIABLE_DICTIONARY.csv saved.")
        
    print("Phase 6 and 7 complete.")

if __name__ == "__main__":
    main()
