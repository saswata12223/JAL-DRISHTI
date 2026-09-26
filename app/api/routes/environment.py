from fastapi import APIRouter, Query, HTTPException
import httpx
import time
import logging
import urllib.parse

router = APIRouter()
logger = logging.getLogger("FlashFloodAI.Environment")

# Simple in-memory cache: {(lat, lon): (timestamp, data)}
CACHE = {}
CACHE_TTL = 300  # 5 minutes

@router.get("/api/environment")
async def get_environment_data(
    lat: float = Query(..., description="Latitude of the location"),
    lon: float = Query(..., description="Longitude of the location")
):
    # Validate coordinates
    if not (-90 <= lat <= 90):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if not (-180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")
        
    # Round to 6 decimal places for cache key
    cache_key = (round(lat, 6), round(lon, 6))
    current_time = time.time()
    
    if cache_key in CACHE:
        cached_time, cached_data = CACHE[cache_key]
        if current_time - cached_time < CACHE_TTL:
            logger.info(f"Serving Open-Meteo data from cache for {cache_key}")
            return cached_data
            
    # Prepare API request
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,rain,surface_pressure,wind_speed_10m,weather_code",
        "hourly": "precipitation,rain,precipitation_probability,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm,soil_moisture_27_to_81cm,temperature_2m,relative_humidity_2m",
        "timezone": "auto"
    }
    
    # Log the exact URL for the user to verify
    # Use safe=',' so that commas in the current/hourly lists aren't url-encoded in the log output for easier reading
    full_url = f"{url}?{urllib.parse.urlencode(params, safe=',')}"
    logger.info(f"Fetching Open-Meteo data for lat={lat}, lon={lon}. Exact URL: {full_url}")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Save to cache
            CACHE[cache_key] = (current_time, data)
            return data
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Open-Meteo API HTTP error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch data from Open-Meteo (HTTP Error)")
    except httpx.RequestError as e:
        logger.error(f"Open-Meteo API request error: {e}")
        raise HTTPException(status_code=503, detail="Failed to fetch data from Open-Meteo (Network/Timeout Error)")
    except Exception as e:
        logger.error(f"Unexpected error fetching Open-Meteo data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching environmental data")
