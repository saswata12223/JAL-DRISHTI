# JAL DRISHTI v1.0 — Target Label Definition & Leakage Protection Protocol

**Project:** Jal Drishti Hydrological Early Warning & Flash Flood Prediction Platform (SIH26192)  
**Dataset Version:** JAL-DRISHTI-ML-DATA-v1.0  
**Target Class Definition Strategy:** Zero-Leakage Machine Learning Target Specification  

---

## 1. Target Label Definitions

The dataset provides 5 forward-looking prediction targets:
- `flood_next_1h` (1-hour lead time prediction)
- `flood_next_3h` (3-hour lead time prediction)
- `flood_next_6h` (6-hour lead time prediction)
- `flood_next_12h` (12-hour lead time prediction)
- `flood_next_24h` (24-hour lead time prediction)

### Allowed Label Values:
- **`1` (Positive Event Class):** Verified rainfall-driven `FLASH_FLOOD`, `CLOUDBURST`, or composite `GLOF` surge observation at exact timestamp $T_0$.
- **`0` (Negative Control Class):** Verified real non-event observation during active monsoon season with zero disaster incidents reported.
- **`NULL` / `NaN` (Uncertain / Date-Only Class):** Used whenever exact hourly timestamp cannot be verified from primary GoI documentation (`DATE_ONLY` events), or for non-meteorological avalanche events. **MUST NEVER BE CONVERTED SILENTLY TO ZERO.**

---

## 2. Target Class Eligibility Taxonomy

```
Hazard Taxonomy & ML Target Suitability:
├── FLASH_FLOOD (3 events)  ──> ELIGIBLE for 1h-6h Target
├── CLOUDBURST (6 events)   ──> ELIGIBLE for 1h-3h Target
├── GLOF (1 event)          ──> COMPOSITE SURGE ELIGIBLE
├── DEBRIS_FLOW (2 events)  ──> EXCLUDED (Chamoli 2021 non-meteorological avalanche)
└── RIVER_FLOOD (2 events)  ──> EXCLUDED from Short-Fuse Flash Flood Model (>24h inundation)
```

---

## 3. Data Leakage Protection Rules

To prevent predictive data leakage during model training:

1. **Input Predictors (`AVAILABLE_AT_PREDICTION_TIME`):**
   - Precipitation indicators ($T-72	ext{h}$ to $T_0$)
   - Antecedent Precipitation Index (API)
   - SMAP soil moisture ($T_0$)
   - Static SRTM DEM terrain features
   - ESA WorldCover land cover features
2. **Outcome Targets (`NOT_AVAILABLE_AT_PREDICTION_TIME`):**
   - Future rainfall ($T > T_0$) belongs **only** to label construction.
   - Target labels (`flood_next_1h` .. `24h`) are target outputs only.
