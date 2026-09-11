"""
FlashFloodAI Backend — Station ORM Model (PostGIS Point Geometry)
"""

from sqlalchemy import Column, String, Float, DateTime, Index
from geoalchemy2 import Geometry
from app.db.database import Base


class Station(Base):
    """Monitoring station entity (CWC hydrological & IMD meteorological stations)."""

    __tablename__ = "stations"

    station_id = Column(String(64), primary_key=True, index=True)
    station_name = Column(String(255), nullable=False)
    station_type = Column(String(64), nullable=False, index=True)  # 'CWC_HYDROLOGICAL' | 'IMD_METEOROLOGICAL'
    river_name = Column(String(128), nullable=True, index=True)
    major_basin = Column(String(128), nullable=True, index=True)
    district = Column(String(128), nullable=False, index=True)
    state = Column(String(64), default="Uttarakhand", nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # PostGIS Point Geometry in EPSG:4326
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    # Official CWC Hydrological Flood Thresholds (m)
    warning_level_m = Column(Float, nullable=True)
    danger_level_m = Column(Float, nullable=True)
    hfl_m = Column(Float, nullable=True)
    gauge_datum_msl_m = Column(Float, nullable=True)

    # Provenance
    source_agency = Column(String(128), nullable=False)
    source_document = Column(String(255), nullable=True)
    source_url = Column(String(512), nullable=True)
    status = Column(String(32), default="ACTIVE", nullable=False)

    __table_args__ = (
        Index("idx_stations_geom", "geom", postgresql_using="gist"),
        Index("idx_stations_district_type", "district", "station_type"),
    )

    def to_dict(self):
        return {
            "station_id": self.station_id,
            "station_name": self.station_name,
            "station_type": self.station_type,
            "river_name": self.river_name,
            "major_basin": self.major_basin,
            "district": self.district,
            "state": self.state,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "warning_level_m": self.warning_level_m,
            "danger_level_m": self.danger_level_m,
            "hfl_m": self.hfl_m,
            "gauge_datum_msl_m": self.gauge_datum_msl_m,
            "source_agency": self.source_agency,
            "source_document": self.source_document,
            "source_url": self.source_url,
            "status": self.status,
        }
