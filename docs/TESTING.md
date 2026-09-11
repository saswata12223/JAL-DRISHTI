# Jal Drishti — Automated Testing & Quality Assurance Guide

---

## 1. Test Suite Overview

Jal Drishti includes an automated cross-module integration test suite in `tests/test_end_to_end.py`.

The test suite validates:
- Presence and integrity of top-level system modules (`backend`, `frontend`, `ml`, `pipelines`, `hardware`, `docs`, `data`).
- Markdown documentation size requirements.
- Single sample ML inference scoring via `ml.inference.FloodRiskInferenceEngine`.
- Batch parquet prediction processing on `flood_ml_features.parquet`.

---

## 2. Test Execution Instructions

### A. Run Integration Test Suite
From the project root `C:\JAL DRISTI` with Python 3.11:

```powershell
python -m unittest tests/test_end_to_end.py
```

### B. Expected Test Output
```
....
----------------------------------------------------------------------
Ran 4 tests in 0.420s

OK
```

---

## 3. Test Environment Requirements & Characteristics

- **Network Requirements:** **NONE.** Tests run 100% offline using local file fixtures.
- **Database Requirements:** **NONE.** Tests do not require a running PostgreSQL or PostGIS instance.
- **Determinism:** Tests are 100% deterministic and repeatable.

---

## 4. Frontend Compilation Check

To verify React web client build integrity:

```powershell
cd "C:\JAL DRISTIrontend"
npm run build
```

---
*Jal Drishti Technical Documentation*
