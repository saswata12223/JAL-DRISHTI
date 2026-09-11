# Contributing to Jal Drishti

Thank you for contributing to **Jal Drishti**! This document provides contribution standards, repository workflows, and coding conventions for developers.

---

## 🌿 Git Branching Strategy

To maintain a clean and reliable codebase, follow this branch strategy:

- `main`: Production-ready code. Must always compile, pass tests, and start cleanly.
- `feature/<feature-name>`: New UI pages, backend endpoints, pipeline modules.
- `fix/<bug-name>`: Bug fixes and performance patches.

---

## 📝 Commit Message Conventions

Write concise, descriptive commit messages:
```
feat(frontend): add station modal telemetry charts
fix(backend): fix data loader parquet date parsing
docs(api): update OpenAPI schemas for /risk/evaluate
```

---

## 📂 Codebase Layout Guidelines

When adding new files, place them strictly according to responsibility:

- `backend/app/api/routes/`: New FastAPI router modules.
- `backend/app/services/`: Core logic, risk engines, data loaders.
- `frontend/src/pages/`: New React page views.
- `frontend/src/components/`: Reusable UI cards, modals, charts.
- `ml/`: Core ML inference engine and SCS-CN physics equations.
- `pipelines/`: Ingestion, feature extraction, standardization jobs.
- `hardware/`: Microcontroller firmware (`.ino`) and gateway scripts.
- `tests/`: Automated unit and integration tests.

---

## 🛡️ Development & Security Rules

1. **Never Commit Virtual Environments or Node Modules:** Ensure `.venv/`, `node_modules/`, and `__pycache__/` remain listed in `.gitignore`.
2. **Never Commit API Keys or Credentials:** Store configuration in environment variables or use `backend/app/config.py` defaults.
3. **No Synthetic Data Injected as Real:** Keep production datasets in `data/processed/` distinct from test fixtures.
4. **Pre-PR Verification:** Before submitting a Pull Request, verify:
   - Frontend compiles: `cd frontend && npm run build`
   - Backend imports cleanly: `py -3.11 -c "import app.main"`
   - Integration tests pass: `python -m unittest tests/test_end_to_end.py`

---
*Jal Drishti Development Team*
