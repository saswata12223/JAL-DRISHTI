import pandas as pd
import xarray as xr
import os
from pathlib import Path

def inspect_nc4(filepath, sha256, size):
    try:
        ds = xr.open_dataset(filepath, engine='netcdf4', chunks={})
        
        dimensions = dict(ds.sizes)
        coordinates = list(ds.coords)
        
        coord_ranges = {}
        for c in coordinates:
            try:
                coord_ranges[c] = f"{ds[c].min().values} to {ds[c].max().values}"
            except:
                coord_ranges[c] = "unknown"
                
        variables = []
        for v in ds.data_vars:
            var_obj = ds[v]
            variables.append({
                "name": v,
                "dims": var_obj.dims,
                "dtype": str(var_obj.dtype),
                "units": var_obj.attrs.get('units', ''),
                "long_name": var_obj.attrs.get('long_name', ''),
                "standard_name": var_obj.attrs.get('standard_name', ''),
                "fill_value": var_obj.attrs.get('_FillValue', ''),
                "scale_factor": var_obj.attrs.get('scale_factor', ''),
                "add_offset": var_obj.attrs.get('add_offset', '')
            })
            
        global_attrs = ds.attrs
        
        # Spatial bounds (heuristic based on lon/lat or longitude/latitude)
        spatial_bounds = "unknown"
        if 'lon' in ds.coords and 'lat' in ds.coords:
            spatial_bounds = f"Lon: {ds['lon'].min().values} to {ds['lon'].max().values}, Lat: {ds['lat'].min().values} to {ds['lat'].max().values}"
        
        temporal_bounds = "unknown"
        if 'time' in ds.coords:
            temporal_bounds = f"Time: {ds['time'].min().values} to {ds['time'].max().values}"
            
        ds.close()
        
        return {
            "filename": filepath.name,
            "sha256": sha256,
            "file_size": size,
            "dimensions": str(dimensions),
            "coordinates": str(coordinates),
            "coord_ranges": str(coord_ranges),
            "spatial_bounds": spatial_bounds,
            "temporal_bounds": temporal_bounds,
            "variables": str(variables),
            "global_attrs": str(global_attrs),
            "status": "SUCCESS"
        }
    except Exception as e:
        return {
            "filename": filepath.name,
            "sha256": sha256,
            "file_size": size,
            "status": f"ERROR: {str(e)}"
        }

def main():
    repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
    manifest_csv = repo_root / "data" / "raw" / "_manifest" / "raw_inventory_before.csv"
    
    if not manifest_csv.exists():
        print("Manifest not found.")
        return
        
    df = pd.read_csv(manifest_csv)
    nc4_files = df[(df['source_category'] == 'raw') & (df['extension'].isin(['.nc', '.nc4']))].copy()
    
    results = []
    
    for idx, row in nc4_files.iterrows():
        filepath = Path(row['absolute_path'])
        res = inspect_nc4(filepath, row['sha256'], row['size'])
        results.append(res)
        
    out_dir = repo_root / "data" / "processed" / "catalog"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_csv = out_dir / "NC4_INVENTORY.csv"
    
    results_df = pd.DataFrame(results)
    results_df.to_csv(out_csv, index=False)
    
    # Write Markdown detailed report
    out_md = out_dir / "NC4_DETAILED_REPORT.md"
    with open(out_md, "w", encoding="utf-8") as f:
        f.write("# NetCDF/NC4 Detailed Forensic Report\n\n")
        for res in results:
            f.write(f"## {res['filename']}\n")
            f.write(f"- **Status**: {res.get('status', 'N/A')}\n")
            f.write(f"- **SHA-256**: {res.get('sha256', 'N/A')}\n")
            f.write(f"- **Size**: {res.get('file_size', 'N/A')} bytes\n")
            if res.get('status') == 'SUCCESS':
                f.write(f"- **Dimensions**: {res['dimensions']}\n")
                f.write(f"- **Coordinates**: {res['coordinates']}\n")
                f.write(f"- **Coordinate Ranges**: {res['coord_ranges']}\n")
                f.write(f"- **Spatial Bounds**: {res['spatial_bounds']}\n")
                f.write(f"- **Temporal Bounds**: {res['temporal_bounds']}\n")
                f.write("### Variables\n")
                try:
                    vars_list = eval(res['variables'])
                    for v in vars_list:
                        f.write(f"- **{v['name']}**: dims={v['dims']}, dtype={v['dtype']}, units={v['units']}, long_name={v['long_name']}, fill_value={v['fill_value']}\n")
                except:
                    pass
                f.write("### Global Attributes\n")
                try:
                    attrs = eval(res['global_attrs'])
                    for k, v in attrs.items():
                        f.write(f"- **{k}**: {v}\n")
                except:
                    pass
            f.write("\n---\n\n")
            
    print(f"Phase 4 complete. Inventory saved to {out_csv} and report to {out_md}")

if __name__ == "__main__":
    main()
