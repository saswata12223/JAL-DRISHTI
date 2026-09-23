import httpx
import urllib.parse
from app.config import settings

class FfewsService:
    @staticmethod
    async def get_telemetry(lat: float, lon: float):
        # Default coordinates to Shimla/Uttarakhand region if not provided
        if not lat or not lon:
            lat = 31.1048
            lon = 77.1734
            
        async with httpx.AsyncClient() as client:
            # 1. Fetch 15-Day Weather (Rainfall & Temp)
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=Asia%2FKolkata&forecast_days=15"
            weather_resp = await client.get(weather_url)
            weather_data = weather_resp.json()
            
            # 2. Fetch 15-Day Flood / River Discharge
            flood_url = f"https://flood-api.open-meteo.com/v1/flood?latitude={lat}&longitude={lon}&daily=river_discharge,river_discharge_median&forecast_days=15"
            flood_resp = await client.get(flood_url)
            flood_data = flood_resp.json()
            
        daily_weather = weather_data.get("daily", {})
        daily_flood = flood_data.get("daily", {})
        
        max_discharge = 0
        avg_median = 0
        median_count = 0
        max_rainfall = 0
        
        chart_data = []
        times = daily_weather.get("time", [])
        
        for index, date_str in enumerate(times):
            discharge = daily_flood.get("river_discharge", [])[index] if len(daily_flood.get("river_discharge", [])) > index and daily_flood["river_discharge"][index] else 0
            median = daily_flood.get("river_discharge_median", [])[index] if len(daily_flood.get("river_discharge_median", [])) > index and daily_flood["river_discharge_median"][index] else 0
            rainfall = daily_weather.get("precipitation_sum", [])[index] if len(daily_weather.get("precipitation_sum", [])) > index and daily_weather["precipitation_sum"][index] else 0
            
            if discharge > max_discharge:
                max_discharge = discharge
            if rainfall > max_rainfall:
                max_rainfall = rainfall
                
            if median > 0:
                avg_median += median
                median_count += 1
                
            chart_data.append({
                "Day": date_str,
                "amount": rainfall,
                "TempMax": daily_weather.get("temperature_2m_max", [])[index] if len(daily_weather.get("temperature_2m_max", [])) > index else 0,
                "TempMin": daily_weather.get("temperature_2m_min", [])[index] if len(daily_weather.get("temperature_2m_min", [])) > index else 0,
                "Discharge": discharge,
                "DischargeMedian": median
            })
            
        avg_median = (avg_median / median_count) if median_count > 0 else 1
        
        # Calculate Risk Score (0-100) based on FFEWS algorithm
        risk_score = 0
        if max_discharge > 0:
            discharge_ratio = max_discharge / avg_median
            risk_score += (discharge_ratio * 15)
            
        if max_rainfall > 20:
            risk_score += (max_rainfall * 0.5)
            
        risk_score = min(100, round(risk_score))
        
        return {
            "riskScore": risk_score,
            "chartData": chart_data
        }

    @staticmethod
    async def send_sms(message: str, to_num: str):
        # Fallback to FFEWS hardcoded credentials if not found in env
        username = getattr(settings, "BULKSMS_USERNAME", "suraz")
        password = getattr(settings, "BULKSMS_PASSWORD", "9813641099")
        
        enc_user = urllib.parse.quote(username)
        enc_pass = urllib.parse.quote(password)
        enc_msg = urllib.parse.quote(message)
        
        body = f"username={enc_user}&password={enc_pass}&message={enc_msg}&want_report=1&msisdn={to_num}"
        
        async with httpx.AsyncClient() as client:
            try:
                # FFEWS original BulkSMS API endpoint
                resp = await client.post(
                    "http://bulksms.2way.co.za:80/eapi/submission/send_sms/2/2.0",
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    content=body
                )
                return True, resp.text
            except Exception as e:
                return False, str(e)
