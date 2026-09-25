import os
import json
import httpx
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

from dotenv import load_dotenv

load_dotenv()

class LiveObservationValidationError(Exception):
    """Raised when live telemetry fails strict validation."""
    pass

class WeatherAdapter:
    """
    Phase 17 Live Telemetry Adapter for OpenWeatherMap.
    Acts as a verifiable proxy for surface observations (IMD).
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENWEATHER_API_KEY")
        self.base_url = "https://api.openweathermap.org/data/2.5/weather"
        self.raw_dir = Path("data/raw/live/openweather")
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        
    def _validate_observation(self, data: Dict[str, Any], retrieval_timestamp: datetime) -> Dict[str, Any]:
        """
        Validates the raw response against Phase 17 strict rules.
        """
        if "dt" not in data:
            raise LiveObservationValidationError("Missing 'dt' observation timestamp from source.")
        if "coord" not in data or "lat" not in data["coord"] or "lon" not in data["coord"]:
            raise LiveObservationValidationError("Missing valid coordinates from source.")
        if "main" not in data:
            raise LiveObservationValidationError("Missing 'main' meteorological variables.")
            
        try:
            obs_dt = datetime.fromtimestamp(data["dt"], tz=timezone.utc)
        except Exception as e:
            raise LiveObservationValidationError(f"Invalid timestamp format: {e}")
            
        # Freshness Check
        age_seconds = (retrieval_timestamp - obs_dt).total_seconds()
        
        # We enforce a freshness rule: If age > 7200 seconds (2 hours), mark it as stale
        is_stale = age_seconds > 7200
        
        validated = {
            "source_id": "openweather",
            "provider": "OpenWeatherMap",
            "observation_timestamp_utc": obs_dt.isoformat(),
            "retrieval_timestamp_utc": retrieval_timestamp.isoformat(),
            "age_seconds": int(age_seconds),
            "is_stale": is_stale,
            "coordinates": {
                "latitude": data["coord"]["lat"],
                "longitude": data["coord"]["lon"],
                "spatial_reference": "EPSG:4326"
            },
            "variables": {
                "temperature_c": data["main"].get("temp"),
                "relative_humidity_pct": data["main"].get("humidity"),
                "surface_pressure_hpa": data["main"].get("pressure"),
                "wind_speed_ms": data.get("wind", {}).get("speed")
            }
        }
        
        # Verify numeric variables
        for k, v in validated["variables"].items():
            if v is not None and not isinstance(v, (int, float)):
                raise LiveObservationValidationError(f"Variable {k} is not numeric.")
                
        return validated

    def fetch_current_observation(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Fetches, validates, and archives a genuine live observation.
        """
        if not self.api_key:
            raise LiveObservationValidationError("AUTH_REQUIRED: OPENWEATHER_API_KEY missing.")
            
        retrieval_timestamp = datetime.now(timezone.utc)
        
        try:
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": "metric"
            }
            with httpx.Client(timeout=10) as client:
                resp = client.get(self.base_url, params=params)
            
            if resp.status_code != 200:
                raise LiveObservationValidationError(f"HTTP {resp.status_code} - {resp.text}")
                
            raw_data = resp.json()
        except httpx.RequestError as e:
            raise LiveObservationValidationError(f"NETWORK_UNREACHABLE: {str(e)}")
            
        # Strict validation
        validated = self._validate_observation(raw_data, retrieval_timestamp)
        
        # Phase 17 Immutable Raw Capture
        safe_time = retrieval_timestamp.strftime("%Y%m%dT%H%M%SZ")
        filename = f"openweather_{lat}_{lon}_{safe_time}.json"
        
        archive_path = self.raw_dir / filename
        with open(archive_path, "w") as f:
            json.dump(raw_data, f, indent=2)
            
        # Update PROVENANCE.json
        import hashlib
        file_hash = hashlib.sha256(json.dumps(raw_data).encode("utf-8")).hexdigest()
        prov_path = self.raw_dir / "PROVENANCE.json"
        
        provenance = []
        if prov_path.exists():
            with open(prov_path, "r") as f:
                provenance = json.load(f)
                
        provenance.append({
            "source_id": "openweather",
            "retrieval_timestamp": retrieval_timestamp.isoformat(),
            "original_filename": filename,
            "source_endpoint": self.base_url,
            "SHA256": file_hash,
            "observation_period": "CURRENT",
            "content_type": "application/json"
        })
        
        with open(prov_path, "w") as f:
            json.dump(provenance, f, indent=2)
            
        return validated
