import json
import pandas as pd
from pathlib import Path
from .config import Status, ContentType

def audit_structured(file_path: Path):
    """
    Audits JSON and CSV files to determine nested structure and records.
    """
    ext = file_path.suffix.lower()
    
    if ext == ".json":
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Simple check for nested data
            has_nested = False
            if isinstance(data, list) and len(data) > 0:
                has_nested = any(isinstance(v, (dict, list)) for v in data[0].values() if isinstance(data[0], dict))
            elif isinstance(data, dict):
                has_nested = any(isinstance(v, (dict, list)) for v in data.values())
                
            return {
                "content_type": "structured_data_json",
                "detection_status": Status.EXTRACTED,
                "extraction_status": Status.PARTIALLY_EXTRACTED if has_nested else Status.EXTRACTED,
                "extraction_method": "json_parse",
                "failure_reason": "Nested dict/list detected (potential data loss during flatten)" if has_nested else None
            }
        except Exception as e:
            return {
                "content_type": "structured_data_json",
                "detection_status": Status.EXTRACTED,
                "extraction_status": Status.UNRESOLVED,
                "extraction_method": "json_parse",
                "failure_reason": f"PARSING_FAILURE: {str(e)}"
            }
            
    elif ext == ".csv":
        try:
            df = pd.read_csv(file_path, nrows=5)
            return {
                "content_type": "structured_data_csv",
                "detection_status": Status.EXTRACTED,
                "extraction_status": Status.EXTRACTED,
                "extraction_method": "pandas_read_csv",
                "failure_reason": None
            }
        except Exception as e:
            return {
                "content_type": "structured_data_csv",
                "detection_status": Status.EXTRACTED,
                "extraction_status": Status.UNRESOLVED,
                "extraction_method": "pandas_read_csv",
                "failure_reason": f"PARSING_FAILURE: {str(e)}"
            }
            
    return None
