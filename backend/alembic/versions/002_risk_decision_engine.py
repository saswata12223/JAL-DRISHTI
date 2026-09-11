"""Risk Decision Engine Schema (PostGIS & TimescaleDB Hypertables)

Revision ID: 002_risk_decision_engine
Revises: 001_initial_schema
Create Date: 2026-08-29 23:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

revision: str = '002_risk_decision_engine'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'risk_decisions',
        sa.Column('timestamp_utc', sa.DateTime(timezone=True), nullable=False),
        sa.Column('spatial_id', sa.String(length=64), nullable=False),
        sa.Column('sample_id', sa.String(length=128), nullable=False, unique=True),
        sa.Column('sample_type', sa.String(length=64), nullable=False),
        sa.Column('station_id', sa.String(length=64), nullable=True),
        sa.Column('station_name', sa.String(length=255), nullable=True),
        sa.Column('district', sa.String(length=128), nullable=False),
        sa.Column('river_name', sa.String(length=128), nullable=True),
        sa.Column('major_basin', sa.String(length=128), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('geom', Geometry(geometry_type='POINT', srid=4326), nullable=True),
        sa.Column('model_name', sa.String(length=64), nullable=False),
        sa.Column('model_version', sa.String(length=32), nullable=False),
        sa.Column('flood_probability', sa.Float(), nullable=False),
        sa.Column('ml_risk_class', sa.String(length=32), nullable=False),
        sa.Column('ml_decision_threshold', sa.Float(), nullable=False, server_default='0.40'),
        sa.Column('water_level_m', sa.Float(), nullable=True),
        sa.Column('warning_level_m', sa.Float(), nullable=True),
        sa.Column('danger_level_m', sa.Float(), nullable=True),
        sa.Column('hfl_m', sa.Float(), nullable=True),
        sa.Column('cwc_threshold_status', sa.String(length=64), nullable=False),
        sa.Column('official_alert_stage', sa.String(length=32), nullable=False),
        sa.Column('is_gauge_offline', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('rainfall_1h_mm', sa.Float(), nullable=True),
        sa.Column('rainfall_3h_mm', sa.Float(), nullable=True),
        sa.Column('soil_saturation_index', sa.Float(), nullable=True),
        sa.Column('scs_direct_runoff_q_mm', sa.Float(), nullable=True),
        sa.Column('scs_peak_runoff_potential', sa.Float(), nullable=True),
        sa.Column('environmental_condition', sa.String(length=64), nullable=False),
        sa.Column('final_risk_class', sa.String(length=32), nullable=False),
        sa.Column('operational_state', sa.String(length=64), nullable=False),
        sa.Column('alert_priority', sa.String(length=32), nullable=False),
        sa.Column('decision_reason', sa.Text(), nullable=False),
        sa.Column('recommended_action', sa.Text(), nullable=False),
        sa.Column('contributing_factors_json', sa.Text(), nullable=False),
        sa.Column('data_quality_status', sa.String(length=32), nullable=False),
        sa.Column('decision_confidence', sa.Float(), nullable=False),
        sa.Column('risk_policy_version', sa.String(length=32), nullable=False, server_default='8.1.0'),
        sa.Column('threshold_source', sa.String(length=255), nullable=True),
        sa.Column('generated_at_utc', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('timestamp_utc', 'spatial_id')
    )
    op.create_index('idx_risk_decisions_geom', 'risk_decisions', ['geom'], postgresql_using='gist')
    op.create_index('idx_risk_decisions_district_risk', 'risk_decisions', ['district', 'final_risk_class'])
    op.create_index('idx_risk_decisions_priority', 'risk_decisions', ['alert_priority'])
    op.execute("SELECT create_hypertable('risk_decisions', 'timestamp_utc', if_not_exists => TRUE);")


def downgrade() -> None:
    op.drop_table('risk_decisions')
