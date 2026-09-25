import pandas as pd
from datetime import datetime, timezone

def parse_and_normalize_timestamp(ts, assumed_tz="UTC"):
    """
    Parses a timestamp and normalizes it to UTC.
    Returns (normalized_timestamp, quality_flag)
    """
    if pd.isna(ts):
        return None, "MISSING"
        
    try:
        dt = pd.to_datetime(ts, utc=True)
        # Check impossible dates (e.g., year 1800 or year 3000)
        if dt.year < 1900 or dt.year > 2050:
            return dt.isoformat(), "INVALID_DATE_RANGE"
        return dt.isoformat(), "VALID"
    except:
        return str(ts), "MALFORMED"
