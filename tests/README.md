# FlashFloodAI — Testing & Integration Module (`tests/`)

**Module Name:** `tests`  
**Scope:** Cross-Module Integration, Regression Testing & End-to-End Verification  
**Lead Developer Role:** QA / DevOps / Backend Engineer  

---

## 1. Purpose & Scope

The `tests/` module hosts cross-module, integration, and end-to-end regression test suites ensuring that modifications in one module (e.g. `pipelines/` or `ml/`) do not break downstream APIs (`backend/`) or visualizations (`frontend/`).

---

## 2. Directory Structure

```text
tests/
├── test_end_to_end.py       # End-to-end pipeline and inference integration test
├── test_ml_inference.py     # Inference engine unit test
└── README.md                # This document
```

---

## 3. How to Run All Test Suites

```powershell
# Activate virtual environment
& "C:\FlashFloodAI\.venv\Scripts\Activate.ps1"

# Run end-to-end integration test
python -m unittest tests/test_end_to_end.py

# Run Phase 6 Automated Acceptance Suite (18 tests)
python scripts/verify_phase6.py

# Run Phase 5 Feature Dataset Suite (17 tests)
python scripts/verify_phase5.py
```
