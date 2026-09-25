"""
FlashFloodAI Backend — System Metadata & Scientific Provenance API Route
"""

from fastapi import APIRouter
from app.schemas.common import APIResponse
from app.schemas.metadata import SystemMetadataResponse

router = APIRouter(prefix="/metadata", tags=["System Metadata"])


@router.get("", response_model=APIResponse[SystemMetadataResponse], summary="Get System Provenance & Metadata")
def get_system_metadata():
    """Returns official agency citations, physical coordinate bounding boxes, and technology stack info."""
    meta = SystemMetadataResponse(
        system_name="FlashFloodAI Backend REST API & Hydrological Database",
        version="7.0.0",
        spatial_coverage={
            "region": "Uttarakhand, India",
            "bounding_box_epsg4326": {
                "min_longitude": 77.80,
                "max_longitude": 81.10,
                "min_latitude": 28.50,
                "max_latitude": 31.50,
            },
            "coordinate_reference_system": "EPSG:4326 (WGS-84)",
        },
        source_agencies=[
            "Central Water Commission (CWC), Government of India",
            "India Meteorological Department (IMD), Ministry of Earth Sciences",
            "NASA Global Precipitation Measurement (GPM IMERG)",
            "NASA Soil Moisture Active Passive (SMAP L4)",
            "USGS Shuttle Radar Topography Mission (SRTM 90m DEM)",
            "European Space Agency (ESA WorldCover 10m Sentinel-2)",
            "Geological Survey of India (GSI) & NDMA Disaster Databases",
        ],
        cwc_monitoring_stations_count=20,
        imd_monitoring_stations_count=157,
        historical_disasters_count=15,
        model_stack={
            "champion_model": "XGBoost Gradient Boosted Classifier (3.4.1)",
            "deep_learning_hybrid": "PyTorch Geometric GCN + Spatio-Temporal LSTM (2.8.0 / 2.13.0)",
            "baseline_model": "Random Forest Classifier (Scikit-Learn 1.9.0)",
            "decision_threshold": 0.40,
            "predictor_count": 44,
        },
        physics_layer={
            "methodology": "SCS-CN / HEC-HMS Runoff Potential & Soil Infiltration Barrier",
            "formulas": {
                "potential_retention_S_mm": "S = (25400 / CN_adj) - 254",
                "initial_abstraction_Ia_mm": "Ia = 0.20 * S",
                "direct_runoff_Q_mm": "Q = (P - Ia)^2 / (P - Ia + S) for P > Ia",
                "peak_runoff_qp": "qp = Q * sin(slope) * (1 - n_Manning)",
            },
        },
        database_technologies=[
            "PostgreSQL (Primary Relational Database)",
            "PostGIS (Geospatial Geometry & Spatial Indexing EPSG:4326)",
            "TimescaleDB (Time-Series Hydrological Hypertables)",
        ],
    )

    return APIResponse(
        success=True,
        data=meta,
    )
