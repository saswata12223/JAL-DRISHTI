"""
FlashFloodAI Backend — ORM Models Registration
"""

from app.db.models.station import Station
from app.db.models.weather_observation import WeatherObservation
from app.db.models.rainfall_observation import RainfallObservation
from app.db.models.soil_moisture_observation import SoilMoistureObservation
from app.db.models.water_level_observation import WaterLevelObservation
from app.db.models.historical_event import HistoricalFloodEvent
from app.db.models.prediction import FloodPrediction
from app.db.models.risk_decision import RiskDecisionRecord

from app.db.models.user import User
from app.db.models.audit import AuditLog

__all__ = [
    "User",
    "AuditLog",
    "Station",
    "WeatherObservation",
    "RainfallObservation",
    "SoilMoistureObservation",
    "WaterLevelObservation",
    "HistoricalFloodEvent",
    "FloodPrediction",
    "RiskDecisionRecord",
]
