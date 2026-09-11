# Jal Drishti — Complete Developer Setup & Run Guide

This guide provides step-by-step instructions for installing dependencies and running **Jal Drishti** on Windows.

---

## 1. Prerequisites

Ensure your development environment meets the following minimum requirements:

- **Operating System:** Windows 10/11 (PowerShell or Command Prompt).
- **Python Version:** **Python 3.11** (64-bit). Verify with `py -3.11 --version`.
- **Node.js Environment:** **Node.js 18+** & **npm 9+**. Verify with `node -v` and `npm -v`.
- **Git:** Git for Windows.

---

## 2. Virtual Environment Setup & Backend Dependencies

Open a PowerShell terminal in the project root `C:\JAL DRISTI`:

```powershell
# Navigate to project root
cd "C:\JAL DRISTI"

# Create a clean Python 3.11 virtual environment
py -3.11 -m venv .venv

# Activate the virtual environment
& "C:\JAL DRISTI\.venv\Scripts\Activate.ps1"

# Upgrade pip and install backend dependencies
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
```

---

## 3. Frontend Installation

Open a second terminal window or navigate to the `frontend/` directory:

```powershell
cd "C:\JAL DRISTIrontend"
npm install
```

---

## 4. Running the Application Locally

### A. Launch Backend REST API (Port 8000)
From the project root `C:\JAL DRISTI` with `.venv` activated:

```powershell
py -3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- **API Base URL:** `http://localhost:8000`
- **Interactive Swagger OpenAPI Docs:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`

### B. Launch Frontend React Web App (Port 5173)
From the `C:\JAL DRISTIrontend` directory:

```powershell
npm run dev
```

- **Frontend Application URL:** `http://localhost:5173`

---

## 5. Running Automated Tests

To execute the automated integration test suite:

```powershell
cd "C:\JAL DRISTI"
python -m unittest tests/test_end_to_end.py
```

---

## 6. Troubleshooting & Common Issues

| Issue | Root Cause | Solution |
|---|---|---|
| `ETIMEDOUT 127.0.0.1` connection error in browser console | Frontend proxy API port mismatch | Ensure backend is running on **Port 8000** (`uvicorn app.main:app --port 8000`). `vite.config.js` proxies `/api` to port 8000. |
| `No module named 'fastapi'` | Virtual environment not activated | Run `& "C:\JAL DRISTI\.venv\Scripts\Activate.ps1"` before starting uvicorn. |
| `FileNotFoundError: flood_risk_predictions.parquet` | Working directory mismatch | Launch uvicorn from `C:\JAL DRISTI` (or `C:\JAL DRISTIackend`). |

---
*Jal Drishti Technical Documentation*
