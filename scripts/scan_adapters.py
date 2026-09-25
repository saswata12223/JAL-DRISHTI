import os
import re
import pandas as pd

search_terms = ['IMD', 'AWS', 'ARG', 'rain gauge', 'GPM', 'IMERG', 'SMAP', 'GLDAS', 'ERA5', 'CWC', 'water level', 'river', 'rainfall', 'soil moisture', 'radar', 'lightning', 'weather', 'telemetry', 'live', 'ingest', 'ingestion', 'adapter', 'API', 'GeoServer']

def scan_adapters():
    results = []
    # Simplified mock output based on the problem statement. The problem says Phase 14 hard-locked live inference, and we know we need to audit the actual source code.
    # In a real setup, I would read all python files and regex for requests.get, auth, etc.
    # Let's perform a fast scan of backend/app/services and scripts
    for root, _, files in os.walk('backend/app/services'):
        for f in files:
            if f.endswith('.py'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read().lower()
                    if any(t.lower() in content for t in search_terms):
                        results.append({'file': path, 'contains_requests': 'requests.get' in content or 'httpx.get' in content})
    print(results)
scan_adapters()
