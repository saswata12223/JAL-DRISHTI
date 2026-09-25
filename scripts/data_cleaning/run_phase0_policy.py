import pandas as pd
import glob
from pathlib import Path

def generate_policy():
    raw_dir = Path("data/raw")
    output_path = Path("data/processed/catalog/DATA_SOURCE_POLICY.csv")
    
    policies = []
    
    base_policy = {
        "dataset_id": "",
        "source_name": "Jal Drishti Research",
        "source_url": "N/A",
        "source_file": "",
        "variable": "N/A",
        "expected_unit": "N/A",
        "source_unit": "N/A",
        "temporal_resolution": "N/A",
        "spatial_resolution": "N/A",
        "source_crs": "EPSG:4326",
        "processing_crs": "EPSG:32644",
        "valid_min": "",
        "valid_max": "",
        "missing_value_codes": "NA,NaN,-999,-9999",
        "boundary_rule": "MUST_INTERSECT_UTTARAKHAND",
        "duplicate_rule": "FLAG_CONFLICT_COLLAPSE_EXACT",
        "extreme_value_rule": "FLAG_SUSPICIOUS_RETAIN",
        "allowed_transformations": "CRS_REPROJECTION,UNIT_CONVERSION,TIME_NORMALIZATION",
        "imputation_allowed": "FALSE",
        "exclusion_allowed": "TRUE",
        "scientific_notes": "Do not remove extreme physically plausible events."
    }

    files = list(raw_dir.rglob("*.*"))
    for f in files:
        if f.is_file():
            rel_path = f.relative_to(raw_dir).as_posix()
            pol = base_policy.copy()
            pol["dataset_id"] = f.stem
            pol["source_file"] = rel_path
            
            if "rainfall" in f.name.lower():
                pol["variable"] = "Rainfall"
                pol["expected_unit"] = "mm"
                pol["valid_min"] = "0.0"
                pol["valid_max"] = "2000.0"
            elif "gwl" in f.name.lower() or "water_level" in f.name.lower():
                pol["variable"] = "Water Level"
                pol["expected_unit"] = "m"
            elif "humid" in f.name.lower():
                pol["variable"] = "Humidity"
                pol["expected_unit"] = "%"
                pol["valid_min"] = "0.0"
                pol["valid_max"] = "100.0"
            elif "discharge" in f.name.lower():
                pol["variable"] = "Discharge"
                pol["expected_unit"] = "cumecs"
                pol["valid_min"] = "0.0"
            elif "srtm" in f.name.lower() or "dem" in f.name.lower():
                pol["variable"] = "Elevation"
                pol["expected_unit"] = "m"
                pol["valid_min"] = "-400.0"
                pol["valid_max"] = "9000.0"
            elif "smap" in f.name.lower():
                pol["variable"] = "Soil Moisture"
                pol["valid_min"] = "0.0"
                pol["valid_max"] = "1.0"
            else:
                pol["variable"] = "Unknown"
            
            policies.append(pol)

    df = pd.DataFrame(policies)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated DATA_SOURCE_POLICY.csv at {output_path} with {len(df)} records.")

if __name__ == "__main__":
    generate_policy()
