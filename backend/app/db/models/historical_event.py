"""
FlashFloodAI Backend — Historical Flood Event ORM Model (PostGIS Point Geometry)
"""

from sqlalchemy import Column, String, Float, Integer, Text, Index
from geoalchemy2 import Geometry
from app.db.database import Base


class HistoricalFloodEvent(Base):
    """Canonical historical flood, flash flood, and GLOF disaster events (1970–2024)."""

    __tablename__ = "historical_flood_events"

    event_id = Column(String(64), primary_key=True, index=True)
    event_date = Column(String(32), nullable=False, index=True)
    event_end_date = Column(String(32), nullable=True)
    event_type = Column(String(64), nullable=False, index=True)
    event_name = Column(String(255), nullable=False)
    state = Column(String(64), default="Uttarakhand", nullable=False)
    district = Column(String(128), nullable=False, index=True)
    location = Column(String(255), nullable=False)
    river_basin = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # PostGIS Point Geometry in EPSG:4326
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    severity_category = Column(String(64), nullable=False)
    deaths = Column(Integer, default=0, nullable=False)
    missing_persons = Column(Float, nullable=True)
    affected_population = Column(Integer, default=0, nullable=False)
    infrastructure_damage = Column(Text, nullable=True)
    rainfall_information = Column(Text, nullable=True)
    water_level_information = Column(Text, nullable=True)
    triggering_hazard = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)

    source_name = Column(String(255), nullable=False)
    source_url = Column(String(512), nullable=True)
    source_publication_date = Column(String(32), nullable=True)
    confidence = Column(String(32), default="HIGH", nullable=False)
    notes = Column(Text, nullable=True)

    __table_args__ = (
        Index("idx_hist_events_geom", "geom", postgresql_using="gist"),
        Index("idx_hist_events_district_type", "district", "event_type"),
    )

    def to_dict(self):
        return {
            "event_id": self.event_id,
            "event_date": self.event_date,
            "event_end_date": self.event_end_date,
            "event_type": self.event_type,
            "event_name": self.event_name,
            "state": self.state,
            "district": self.district,
            "location": self.location,
            "river_basin": self.river_basin,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "severity_category": self.severity_category,
            "deaths": self.deaths,
            "missing_persons": self.missing_persons,
            "affected_population": self.affected_population,
            "infrastructure_damage": self.infrastructure_damage,
            "rainfall_information": self.rainfall_information,
            "water_level_information": self.water_level_information,
            "triggering_hazard": self.triggering_hazard,
            "description": self.description,
            "source_name": self.source_name,
            "source_url": self.source_url,
            "confidence": self.confidence,
        }
