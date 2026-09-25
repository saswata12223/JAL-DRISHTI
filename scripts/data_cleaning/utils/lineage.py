import json
import datetime
from pathlib import Path
import sys

def create_lineage(dataset_name, version, source_files, source_hashes, transformations, excluded_records=0):
    return {
        "dataset": dataset_name,
        "version": version,
        "source_files": source_files,
        "source_hashes": source_hashes,
        "transformations": transformations,
        "excluded_records": excluded_records,
        "unit_conversions": [],
        "spatial_operations": [],
        "temporal_operations": [],
        "duplicate_resolution": [],
        "software_version": "Jal Drishti Pipeline v1",
        "python_version": sys.version,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

def save_lineage(lineage_dict, output_dir="data/processed/lineage"):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    filename = f"{lineage_dict['dataset']}_v{lineage_dict['version']}.json"
    with open(out / filename, "w") as f:
        json.dump(lineage_dict, f, indent=2)
