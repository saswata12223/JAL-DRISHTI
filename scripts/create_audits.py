import csv
import os

expected_sources = ["IMD_AWS", "IMD_ARG", "GPM_IMERG", "SMAP", "GLDAS", "ERA5", "ERA5_Land", "CWC"]

def write_csv(filename, fieldnames, data_generator):
    path = f'data/processed/live/{filename}'
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data_generator)

# 1. Observation Audit
obs_fields = ["observation_id", "source_id", "provider", "station_or_grid_id", "observation_timestamp_utc", 
              "retrieval_timestamp_utc", "latitude", "longitude", "variable", "value", "unit", 
              "spatial_resolution", "product", "provenance_url", "quality_status", "freshness_status"]
obs_data = [{k: "UNAVAILABLE" if k != "source_id" else s for k in obs_fields} for s in expected_sources]
write_csv('phase16_observation_audit.csv', obs_fields, obs_data)

# 2. Freshness Audit
freshness_fields = ["source_id", "observation_timestamp_utc", "retrieval_timestamp_utc", "age_seconds", "freshness_status"]
freshness_data = [{k: "UNKNOWN" if k != "source_id" else s for k in freshness_fields} for s in expected_sources]
for d in freshness_data:
    d["freshness_status"] = "UNVERIFIED"
write_csv('phase16_freshness_audit.csv', freshness_fields, freshness_data)

# 3. Provenance Audit
prov_fields = ["source_id", "provenance_url", "provider", "authentication", "product", "version"]
prov_data = [{k: "UNVERIFIED" if k != "source_id" else s for k in prov_fields} for s in expected_sources]
write_csv('phase16_provenance_audit.csv', prov_fields, prov_data)

# 4. Geospatial Audit
geo_fields = ["source_id", "latitude", "longitude", "inside_uttarakhand", "station_identity", "coordinate_provenance"]
geo_data = [{k: "SPATIAL_REFERENCE_UNVERIFIED" if k != "source_id" else s for k in geo_fields} for s in expected_sources]
write_csv('phase16_geospatial_audit.csv', geo_fields, geo_data)

# 5. Unit Audit
unit_fields = ["source_id", "variable", "raw_unit", "normalized_unit", "conversion_applied", "conversion_formula", "unit_source", "unit_verified"]
unit_data = [{k: "UNVERIFIED" if k != "source_id" else s for k in unit_fields} for s in expected_sources]
write_csv('phase16_unit_audit.csv', unit_fields, unit_data)

print("All Phase 16 audit CSVs created.")
