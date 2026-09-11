"""Initial Database Schema (PostGIS & TimescaleDB Hypertables)

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-29 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable PostGIS and TimescaleDB extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")

    # 2. Create stations table
    op.create_table(
        'stations',
        sa.Column('station_id', sa.String(length=64), nullable=False),
        sa.Column('station_name', sa.String(length=255), nullable=False),
        sa.Column('station_type', sa.String(length=64), nullable=False),
        sa.Column('river_name', sa.String(length=128), nullable=True),
        sa.Column('major_basin', sa.String(length=128), nullable=True),
        sa.Column('district', sa.String(length=128), nullable=False),
        sa.Column('state', sa.String(length=64), nullable=False, server_default='Uttarakhand'),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('geom', Geometry(geometry_type='POINT', srid=4326), nullable=True),
        sa.Column('warning_level_m', sa.Float(), nullable=True),
        sa.Column('danger_level_m', sa.Float(), nullable=True),
        sa.Column('hfl_m', sa.Float(), nullable=True),
        sa.Column('gauge_datum_msl_m', sa.Float(), nullable=True),
        sa.Column('source_agency', sa.String(length=128), nullable=False),
        sa.Column('source_document', sa.String(length=255), nullable=True),
        sa.Column('source_url', sa.String(length=512), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='ACTIVE'),
        sa.PrimaryKeyConstraint('station_id')
    )
    op.create_index('idx_stations_geom', 'stations', ['geom'], postgresql_using='gist')
    op.create_index('idx_stations_district_type', 'stations', ['district', 'station_type'])

    # 3. Create historical_flood_events table
    op.create_table(
        'historical_flood_events',
        sa.Column('event_id', sa.String(length=64), nullable=False),
        sa.Column('event_date', sa.String(length=32), nullable=False),
        sa.Column('event_end_date', sa.String(length=32), nullable=True),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('event_name', sa.String(length=255), nullable=False),
        sa.Column('state', sa.String(length=64), nullable=False, server_default='Uttarakhand'),
        sa.Column('district', sa.String(length=128), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('river_basin', sa.String(length=128), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('geom', Geometry(geometry_type='POINT', srid=4326), nullable=True),
        sa.Column('severity_category', sa.String(length=64), nullable=False),
        sa.Column('deaths', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('missing_persons', sa.Float(), nullable=True),
        sa.Column('affected_population', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('infrastructure_damage', sa.Text(), nullable=True),
        sa.Column('rainfall_information', sa.Text(), nullable=True),
        sa.Column('water_level_information', sa.Text(), nullable=True),
        sa.Column('triggering_hazard', sa.String(length=255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('source_name', sa.String(length=255), nullable=False),
        sa.Column('source_url', sa.String(length=512), nullable=True),
        sa.Column('source_publication_date', sa.String(length=32), nullable=True),
        sa.Column('confidence', sa.String(length=32), nullable=False, server_default='HIGH'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('event_id')
    )
    op.create_index('idx_hist_events_geom', 'historical_flood_events', ['geom'], postgresql_using='gist')

    # 4. Create weather_observations table
    op.create_table(
        'weather_observations',
        sa.Column('timestamp_utc', sa.DateTime(timezone=True), nullable=False),
        sa.Column('station_id', sa.String(length=64), nullable=False),
        sa.Column('station_name', sa.String(length=255), nullable=True),
        sa.Column('district', sa.String(length=128), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('geom', Geometry(geometry_type='POINT', srid=4326), nullable=True),
        sa.Column('temperature_c', sa.Float(), nullable=True),
        sa.Column('relative_humidity_pct', sa.Float(), nullable=True),
        sa.Column('surface_pressure_hpa', sa.Float(), nullable=True),
        sa.Column('wind_speed_ms', sa.Float(), nullable=True),
        sa.Column('rainfall_mm', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('timestamp_utc', 'station_id')
    )
    op.execute("SELECT create_hypertable('weather_observations', 'timestamp_utc', if_not_exists => TRUE);")

    # 5. Create rainfall_observations table
    op.create_table(
        'rainfall_observations',
        sa.Column('timestamp_utc', sa.DateTime(timezone=True), nullable=False),
        sa.Column('spatial_id', sa.String(length=64), nullable=False),
        sa.Column('district', sa.String(length=128), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('geom', Geometry(geometry_type='POINT', srid=4326), nullable=True),
        sa.Column('rainfall_30min_mm', sa.Float(), nullable=True),
        sa.Column('rainfall_1h_mm', sa.Float(), nullable=True),
        sa.Column('rainfall_3h_mm', sa.Float(), nullable=True),
        sa.Column('max_intensity_mmh', sa.Float(), nullable=True),
        sa.Column('mean_intensity_mmh', sa.Float(), nullable=True),
        sa.Column('effective_precipitation_mm', sa.Float(), nullable=True),
        sa.Column('antecedent_precipitation_index_mm', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('timestamp_utc', 'spatial_id')
    )
    op.execute("SELECT create_hypertable('rainfall_observations', 'timestamp_utc', if_not_exists => TRUE);")

    # 6. Create soil_moisture_observations table
    op.create_table(
        'soil_moisture_observations',
        sa.Column('timestamp_utc', sa.DateTime(timezone=True), nullable=False),
        sa.Column('spatial_id', sa.String(length=64), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('geom', Geometry(geometry_type='POINT', srid=4326), nullable=True),
        sa.Column('surface_soil_moisture_vol', sa.Float(), nullable=True),
        sa.Column('rootzone_soil_moisture_vol', sa.Float(), nullable=True),
        sa.Column('profile_soil_moisture_vol', sa.Float(), nullable=True),
        sa.Column('soil_saturation_index', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('timestamp_utc', 'spatial_id')
    )
    op.execute("SELECT create_hypertable('soil_moisture_observations', 'timestamp_utc', if_not_exists => TRUE);")

    # 7. Create water_level_observations table
    op.create_table(
        'water_level_observations',
        sa.Column('timestamp_utc', sa.DateTime(timezone=True), nullable=False),
        sa.Column('station_id', sa.String(length=64), nullable=False),
        sa.Column('station_name', sa.String(length=255), nullable=True),
        sa.Column('river_name', sa.String(length=128), nullable=True),
        sa.Column('district', sa.String(length=128), nullable=True),
        sa.Column('water_level_m', sa.Float(), nullable=True),
        sa.Column('discharge_cumec', sa.Float(), nullable=True),
        sa.Column('warning_level_m', sa.Float(), nullable=True),
        sa.Column('danger_level_m', sa.Float(), nullable=True),
        sa.Column('hfl_m', sa.Float(), nullable=True),
        sa.Column('official_flood_status', sa.String(length=64), nullable=False, server_default='DATA_UNAVAILABLE'),
        sa.Column('official_alert_stage', sa.String(length=32), nullable=False, server_default='UNKNOWN'),
        sa.Column('is_telemetry_missing', sa.Boolean(), nullable=False, server_default='true'),
        sa.PrimaryKeyConstraint('timestamp_utc', 'station_id')
    )
    op.execute("SELECT create_hypertable('water_level_observations', 'timestamp_utc', if_not_exists => TRUE);")

    # 8. Create flood_predictions table
    op.create_table(
        'flood_predictions',
        sa.Column('timestamp_utc', sa.DateTime(timezone=True), nullable=False),
        sa.Column('spatial_id', sa.String(length=64), nullable=False),
        sa.Column('sample_id', sa.String(length=128), nullable=False, unique=True),
        sa.Column('sample_type', sa.String(length=64), nullable=False),
        sa.Column('district', sa.String(length=128), nullable=False),
        sa.Column('major_basin', sa.String(length=128), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('geom', Geometry(geometry_type='POINT', srid=4326), nullable=True),
        sa.Column('model_name', sa.String(length=64), nullable=False),
        sa.Column('model_version', sa.String(length=32), nullable=False),
        sa.Column('prediction_probability', sa.Float(), nullable=False),
        sa.Column('ml_risk_class', sa.String(length=32), nullable=False),
        sa.Column('ml_decision_threshold', sa.Float(), nullable=False, server_default='0.40'),
        sa.Column('scs_direct_runoff_q_mm', sa.Float(), nullable=True),
        sa.Column('scs_peak_runoff_potential', sa.Float(), nullable=True),
        sa.Column('official_flood_status', sa.String(length=64), nullable=False, server_default='DATA_UNAVAILABLE'),
        sa.Column('official_alert_stage', sa.String(length=32), nullable=False, server_default='UNKNOWN'),
        sa.Column('warning_level_m', sa.Float(), nullable=True),
        sa.Column('danger_level_m', sa.Float(), nullable=True),
        sa.Column('hfl_m', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('timestamp_utc', 'spatial_id')
    )
    op.execute("SELECT create_hypertable('flood_predictions', 'timestamp_utc', if_not_exists => TRUE);")


def downgrade() -> None:
    op.drop_table('flood_predictions')
    op.drop_table('water_level_observations')
    op.drop_table('soil_moisture_observations')
    op.drop_table('rainfall_observations')
    op.drop_table('weather_observations')
    op.drop_table('historical_flood_events')
    op.drop_table('stations')
