"""
FlashFloodAI Backend — Application Configuration & Settings
"""

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    """Application configuration loaded from environment or defaults."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Project metadata
    PROJECT_NAME: str = "FlashFloodAI Backend REST API"
    VERSION: str = "7.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # PostgreSQL / PostGIS / TimescaleDB configuration
    POSTGRES_HOST: str = Field(default="localhost", alias="POSTGRES_HOST")
    POSTGRES_PORT: int = Field(default=5432, alias="POSTGRES_PORT")
    POSTGRES_DB: str = Field(default="flashfloodai", alias="POSTGRES_DB")
    POSTGRES_USER: str = Field(default="postgres", alias="POSTGRES_USER")
    POSTGRES_PASSWORD: str = Field(default="postgres", alias="POSTGRES_PASSWORD")

    DATABASE_URL: Optional[str] = Field(default=None, alias="DATABASE_URL")

    # Spatial Bounds (Uttarakhand)
    BBOX_MIN_LON: float = 77.80
    BBOX_MAX_LON: float = 81.10
    BBOX_MIN_LAT: float = 28.50
    BBOX_MAX_LAT: float = 31.50
    DEFAULT_SRID: int = 4326

    # Model inference settings
    ML_MODEL_PATH: str = Field(
        default_factory=lambda: str(BASE_DIR / "data" / "processed" / "ml" / "models" / "final_flood_risk_model.joblib")
    )
    ML_ALLOWLIST_PATH: str = Field(
        default_factory=lambda: str(BASE_DIR / "data" / "processed" / "ml" / "model_feature_allowlist.json")
    )
    ML_DECISION_THRESHOLD: float = 0.40

    # OpenWeather API Configuration
    OPENWEATHER_API_KEY: Optional[str] = Field(default=None, alias="OPENWEATHER_API_KEY")
    DEFAULT_LAT: float = 30.0668
    DEFAULT_LON: float = 79.0193

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    @property
    def sync_database_url(self) -> str:
        if self.DATABASE_URL:
            # Normalize driver for psycopg2
            if self.DATABASE_URL.startswith("postgresql://") and not self.DATABASE_URL.startswith("postgresql+psycopg2://"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
            return self.DATABASE_URL
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def async_database_url(self) -> str:
        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgresql://") and not self.DATABASE_URL.startswith("postgresql+asyncpg://"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()
