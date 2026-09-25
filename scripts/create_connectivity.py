import csv
from datetime import datetime, timezone

expected_sources = ["IMD_AWS", "IMD_ARG", "GPM_IMERG", "SMAP", "GLDAS", "ERA5", "ERA5_Land", "CWC"]
results = []
now = datetime.now(timezone.utc).isoformat()

for source in expected_sources:
    results.append({
        "attempt_timestamp_utc": now,
        "network_attempted": "FALSE",
        "endpoint": "NONE",
        "http_status": "NONE",
        "response_received": "FALSE",
        "parser_success": "FALSE",
        "observation_found": "FALSE",
        "observation_timestamp": "NONE",
        "retrieval_timestamp": "NONE",
        "freshness_age_seconds": "NONE",
        "status": "NOT_CONFIGURED",
        "error_class": "ADAPTER_MISSING"
    })

csv_file = 'data/processed/live/phase16_connectivity_results.csv'
keys = results[0].keys()

with open(csv_file, 'w', newline='', encoding='utf-8') as f:
    dict_writer = csv.DictWriter(f, fieldnames=keys)
    dict_writer.writeheader()
    dict_writer.writerows(results)

print("phase16_connectivity_results.csv created.")
