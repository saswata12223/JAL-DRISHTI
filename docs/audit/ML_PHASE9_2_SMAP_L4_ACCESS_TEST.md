# JAL DRISHTI — PHASE 9.2-A: NASA SMAP L4 VERSION 8 ACCESS TEST REPORT

**Project:** Jal Drishti Hydrological Early Warning & Flash Flood Prediction Platform (SIH26192)  
**Execution Timestamp:** September 14, 2026 22:33:02 IST (17:03:02 UTC)  
**Final Classification:** **`REAL_ACCESS_CONFIRMED`**  
**Production ML Isolation:** **100% ENFORCED (Zero model or 34-feature contract mutation)**

---

## 1. Executive Summary

This report documents the official access verification test for **NASA SMAP Level 4 Global 3-hourly 9 km EASE-Grid Surface and Root Zone Soil Moisture Geophysical Data, Version 8 (`SPL4SMGP.008`)** via NSIDC DAAC / NASA Earthdata Cloud.

Authentication was performed non-interactively using pre-configured NASA Earthdata credentials from `.env`. A single real operational HDF5 granule was discovered, downloaded, verified for binary integrity, and inspected for HDF5 dataset structure, spatial grid projections, temporal bounds, and soil moisture variable schemas.

Zero synthetic, mock, or fallback data were created.

---

## 2. Access Test Summary & Provenance Metadata

| Audit Parameter | Verification Value |
| :--- | :--- |
| **Authentication Result** | **`SUCCESS`** (NASA Earthdata Cloud via `earthaccess`) |
| **Product Identifier** | `SPL4SMGP` |
| **Product Version** | `008` (Version 8) |
| **Product Title** | SMAP L4 Global 3-hourly 9 km EASE-Grid Surface and Root Zone Soil Moisture Geophysical Data |
| **Digital Object Identifier (DOI)** | `10.5067/6VK8F9TCV056` |
| **CMR Concept ID** | `G4310126826-NSIDC_CPRD` |
| **Discovered Granule ID** | `SMAP_L4_SM_gph_20260911T223000_Vv8011_001.h5` |
| **Downloaded File Name** | `SMAP_L4_SM_gph_20260911T223000_Vv8011_001.h5` |
| **Downloaded File Size** | **150,383,099 bytes (143.42 MB)** |
| **Download Timestamp** | `2026-09-14 17:03:02 UTC` (`22:33:02 IST`) |
| **Observation Start Time** | `2026-09-11 21:00:00 UTC` |
| **Observation End Time** | `2026-09-12 00:00:00 UTC` |
| **Source Download URL** | `https://data.nsidc.earthdatacloud.nasa.gov/nsidc-cumulus-prod-protected/SMAP/SPL4SMGP/008/2026/09/11/SMAP_L4_SM_gph_20260911T223000_Vv8011_001.h5` |
| **Final Classification** | **`REAL_ACCESS_CONFIRMED`** |

---

## 3. HDF5 Granule Structure & Group Inspection

Binary verification using Python `h5py` confirmed valid top-level groups and 53 datasets:

```
Top-Level HDF5 Groups:
 ├── EASE2_global_projection
 ├── Geophysical_Data
 ├── Metadata
 ├── cell_column
 ├── cell_lat
 ├── cell_lon
 ├── cell_row
 ├── time
 ├── x
 └── y
```

### Global HDF5 Attributes
- **Institution:** NASA Global Modeling and Assimilation Office (GMAO)
- **Title:** SMAP L4_SM Geophysical (GPH) Data Granule
- **Source Software:** `v18.1.0` / `ldas2daac.x`
- **Conventions:** CF-1.6 / HDF5

---

## 4. Identified Target Soil Moisture Variables

Both primary target soil moisture datasets requested for hydrological modeling were discovered and verified inside `/Geophysical_Data`:

1. **Surface Volumetric Soil Moisture:**
   - **HDF5 Dataset Path:** `Geophysical_Data/sm_surface`
   - **Dimensions / Shape:** `(1624, 3856)` (Global 9 km grid)
   - **Data Type:** `float32`
   - **Units:** $\text{m}^3/\text{m}^3$ (volumetric fraction)
   - **Valid Range:** $0.00$ to $0.9039\text{ m}^3/\text{m}^3$ (Fill value: $-9999.0$)

2. **Root-Zone Volumetric Soil Moisture:**
   - **HDF5 Dataset Path:** `Geophysical_Data/sm_rootzone`
   - **Dimensions / Shape:** `(1624, 3856)` (Global 9 km grid)
   - **Data Type:** `float32`
   - **Units:** $\text{m}^3/\text{m}^3$ (volumetric fraction)
   - **Valid Range:** $0.00$ to $0.9309\text{ m}^3/\text{m}^3$ (Fill value: $-9999.0$)

---

## 5. Spatial Reference & Uttarakhand Domain Coverage

- **Projection:** EASE-Grid 2.0 Global Cylindrical Projection (`EASE2_global_projection`)
- **Spatial Resolution:** 9 km ($1624 \text{ rows} \times 3856 \text{ columns}$)
- **Uttarakhand Domain Coverage:** **`CONFIRMED_COVERED`**
  - The 9 km global grid covers all land surfaces between $85.044°\text{N}$ and $-85.044°\text{S}$, fully encompassing the Uttarakhand bounding box ($77.8°\text{E}$ to $81.1°\text{E}$, $28.5°\text{N}$ to $31.5°\text{N}$).

---

## 6. Conclusion & Phase Status

$$\mathbf{Status: REAL\_ACCESS\_CONFIRMED}$$

Real, un-synthesized access to NASA SMAP L4 Version 8 (`SPL4SMGP.008`) is 100% verified. The dataset provides high-frequency 3-hourly $9\text{ km}$ surface and root-zone soil moisture fields suitable for Phase 9.2 hydrological pipeline integration.
