# FlashFloodAI — Backend REST API & Database Layer (`backend/`)

**Module Name:** `backend`  
**Primary Phase:** Phase 7 (Backend & Database Foundation)  
**Technology Stack:** FastAPI, PostgreSQL, PostGIS, TimescaleDB, SQLAlchemy, Alembic  
**Target Region:** Uttarakhand, India ($77.8^\circ\text{E} - 81.1^\circ\text{E},\, 28.5^\circ\text{N} - 31.5^\circ\text{N}$)  

---

## 1. Overview & Architecture

The `backend/` module provides the operational service and data layer for FlashFloodAI:
- **FastAPI REST API**: High-performance asynchronous and thread-safe endpoints serving monitoring stations, CWC thresholds, hydrological observations, historical disaster events, and ML risk predictions.
- **PostgreSQL & PostGIS**: Primary geospatial database storing monitoring stations and disaster events as EPSG:4326 `Point` geometries with GiST spatial indexing.
- **TimescaleDB**: Time-series database engine utilizing partitioned hypertables for high-throughput sensor telemetry, gridded rainfall, soil moisture, and model prediction time-series.
- **ML & Physics Serving**: Integrated service layer executing the Phase 6 XGBoost champion model and SCS-CN / HEC-HMS hydrological physics equations on-the-fly.

---

## 2. Directory Structure

```text
backend/
├── alembic/                 # Alembic database migration scripts
│   ├── env.py               # Migration environment configuration
│   ├── script.py.mako       # Migration template
│   └── versions/
│       └── 001_initial_schema.py # DDL with PostGIS & TimescaleDB hypertables
├── alembic.ini              # Alembic configuration file
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entrypoint
│   ├── config.py            # Pydantic Settings & environment variables
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/          # REST API endpoints
│   │       ├── health.py           # GET /api/v1/health
│   │       ├── stations.py         # GET /api/v1/stations, /stations/{id}
│   │       ├── observations.py     # GET /api/v1/observations/*
│   │       ├── predictions.py      # GET /api/v1/predictions, POST /infer
│   │       ├── historical_events.py# GET /api/v1/historical-events
│   │       └── metadata.py         # GET /api/v1/metadata
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py      # SQLAlchemy sessionmaker & PostGIS extension hooks
│   │   └── models/          # SQLAlchemy ORM Models
│   │       ├── station.py                  # PostGIS Point(4326) monitoring stations
│   │       ├── weather_observation.py      # IMD weather hypertable
│   │       ├── rainfall_observation.py     # GPM rainfall hypertable
│   │       ├── soil_moisture_observation.py# SMAP soil moisture hypertable
│   │       ├── water_level_observation.py  # CWC water level hypertable
│   │       ├── historical_event.py         # PostGIS Point(4326) 15 disaster events
│   │       └── prediction.py               # ML prediction & physics hypertable
│   │
│   ├── schemas/             # Pydantic request/response schemas
│   │   ├── common.py        # APIResponse envelope, GeoJSON models
│   │   ├── stations.py      # Station response models
│   │   ├── observations.py  # Weather, rainfall, water level schemas
│   │   ├── predictions.py   # Prediction & live inference schemas
│   │   ├── historical_events.py # Disaster event schemas
│   │   └── metadata.py      # System metadata schemas
│   │
│   └── services/            # Business & ingestion logic
│       ├── data_loader.py          # Idempotent loader for data/processed/ artifacts
│       ├── prediction_service.py   # Wrapper for Phase 6 FloodRiskInferenceEngine
│       └── health_service.py       # Health check & diagnostic inspector
│
├── tests/                   # Backend integration & unit tests
├── requirements.txt         # Python dependencies
├── .env.example             # Environment template
└── README.md                # This documentation
```

---

## 3. Database Entities & Hypertable Design

| Entity Table | Primary Key | Technology | Spatial Geometry | Hypertable Partition Key |
|---|:---:|:---:|:---:|:---:|
| `stations` | `station_id` | PostGIS | `geom: Point(4326)` | N/A (Dimension table) |
| `historical_flood_events` | `event_id` | PostGIS | `geom: Point(4326)` | N/A (Catalog table) |
| `weather_observations` | `(timestamp_utc, station_id)` | TimescaleDB | `geom: Point(4326)` | `timestamp_utc` (1-day chunk) |
| `rainfall_observations` | `(timestamp_utc, spatial_id)` | TimescaleDB | `geom: Point(4326)` | `timestamp_utc` (1-day chunk) |
| `soil_moisture_observations` | `(timestamp_utc, spatial_id)` | TimescaleDB | `geom: Point(4326)` | `timestamp_utc` (1-day chunk) |
| `water_level_observations` | `(timestamp_utc, station_id)` | TimescaleDB | N/A | `timestamp_utc` (1-day chunk) |
| `flood_predictions` | `(timestamp_utc, spatial_id)` | TimescaleDB | `geom: Point(4326)` | `timestamp_utc` (1-day chunk) |

---

## 4. Setup & Running Instructions

### Prerequisites
- Python 3.10+
- PostgreSQL 14+ with PostGIS 3.2+ and TimescaleDB 2.8+ extensions

### Environment Configuration
```powershell
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL credentials
```

### Run Migrations
```powershell
cd C:\FlashFloodAI\backend
alembic upgrade head
```

### Ingest Data into Database
```powershell
& "C:\FlashFloodAI\.venv\Scripts\python.exe" -c "
from app.db.database import SessionLocal
from app.services.data_loader import DatabaseDataLoader
loader = DatabaseDataLoader()
with SessionLocal() as session:
    counts = loader.ingest_into_database(session)
    print('Ingestion counts:', counts)
"
```

### Start FastAPI Development Server
```powershell
cd C:\FlashFloodAI\backend
& "C:\FlashFloodAI\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 5. API Endpoints Summary

| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/api/v1/health` | System health, database connection, and ML engine readiness |
| `GET` | `/api/v1/stations` | List CWC & IMD monitoring stations with district/river filters |
| `GET` | `/api/v1/stations/{station_id}` | Station detail with verified CWC Warning/Danger/HFL thresholds |
| `GET` | `/api/v1/observations/weather` | IMD meteorological observations |
| `GET` | `/api/v1/observations/rainfall` | GPM IMERG gridded rainfall measurements |
| `GET` | `/api/v1/observations/soil-moisture` | NASA SMAP surface and rootzone soil moisture |
| `GET` | `/api/v1/observations/water-level` | CWC river water levels (strictly preserves offline status) |
| `GET` | `/api/v1/historical-events` | 15 canonical Uttarakhand disaster events (1970–2024) |
| `GET` | `/api/v1/historical-events/{event_id}` | Disaster event documentation and agency citations |
| `GET` | `/api/v1/predictions` | Multi-scale flood risk predictions and SCS-CN runoff |
| `GET` | `/api/v1/predictions/latest` | Latest state of monitored points across Uttarakhand |
| `POST` | `/api/v1/predictions/infer` | On-demand live inference with SCS-CN physics calculation |
| `GET` | `/api/v1/metadata` | System provenance, coordinates, and physical formulas |
| `GET` | `/docs` | Interactive Swagger UI API documentation |
| `GET` | `/openapi.json` | OpenAPI 3.1.0 schema specification |

---

## 6. Verification Test Suite

```powershell
# Run Phase 7 Automated Acceptance Suite:
python scripts/verify_phase7.py
```
