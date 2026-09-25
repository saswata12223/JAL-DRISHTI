import os
import csv
from pathlib import Path

inventory = []

# List of expected sources
expected_sources = ["IMD_AWS", "IMD_ARG", "GPM_IMERG", "SMAP", "GLDAS", "ERA5", "ERA5_Land", "CWC"]

# Define what actually exists in codebase
for source in expected_sources:
    # We did not find any actual adapter for CWC, IMD, GPM, SMAP, GLDAS, ERA5 that does live fetching.
    # We saw OpenWeather in weather_service.py and ESP32 in hardware_telemetry_service.py
    # But for the requested sources, they are missing or historical only.
    inventory.append({
        "source_id": source,
        "provider": source.split('_')[0] if '_' in source else source,
        "adapter_file": "NONE",
        "adapter_function": "NONE",
        "endpoint_or_product": "NONE",
        "authentication_required": "UNKNOWN",
        "credentials_present": "FALSE",
        "network_request_present": "FALSE",
        "response_parser_present": "FALSE",
        "timestamp_field": "NONE",
        "latitude_field": "NONE",
        "longitude_field": "NONE",
        "variable_field": "NONE",
        "unit_field": "NONE",
        "persistence_path": "NONE",
        "currently_called_by_application": "FALSE",
        "status": "NOT_CONFIGURED",
        "evidence": f"No active adapter for {source} found in repository"
    })

os.makedirs('data/processed/live', exist_ok=True)
csv_file = 'data/processed/live/phase16_source_inventory.csv'
keys = inventory[0].keys()

with open(csv_file, 'w', newline='', encoding='utf-8') as f:
    dict_writer = csv.DictWriter(f, fieldnames=keys)
    dict_writer.writeheader()
    dict_writer.writerows(inventory)

print("phase16_source_inventory.csv created.")
