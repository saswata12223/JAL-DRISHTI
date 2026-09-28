import os
import requests
import xml.etree.ElementTree as ET
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from geoalchemy2.shape import from_shape
from shapely.geometry import Polygon

from app.db.database import SessionLocal
from app.db.models.sachet_alert import SachetAlert

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SACHET_RSS_URL = os.getenv("SACHET_INDIA_RSS_URL", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml")
HEADERS = {"User-Agent": "Jal-Drishti/1.0"}

def fetch_sachet_rss():
    """Fetches the SACHET All India CAP RSS Feed and returns a list of CAP XML URLs."""
    logger.info(f"Fetching SACHET RSS Feed from {SACHET_RSS_URL}")
    response = requests.get(SACHET_RSS_URL, headers=HEADERS, timeout=30)
    response.raise_for_status()
    
    root = ET.fromstring(response.content)
    alerts = []
    
    for item in root.findall(".//item"):
        title = item.findtext("title")
        link = item.findtext("link")
        pub_date = item.findtext("pubDate")
        
        if link:
            alerts.append({
                "title": title,
                "cap_url": link.strip(),
                "published_at": pub_date
            })
            
    logger.info(f"Discovered {len(alerts)} alerts in RSS feed.")
    return alerts

def _parse_datetime(dt_str):
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str)
    except ValueError:
        return None

def parse_cap_alert(xml_bytes, cap_url):
    """Parses an individual CAP XML payload and extracts structured alerting data."""
    try:
        root = ET.fromstring(xml_bytes)
        
        def find_text(element, tag_name):
            if element is None: return None
            for child in element:
                if child.tag.split('}')[-1] == tag_name:
                    return child.text.strip() if child.text else None
            return None

        def find_el(element, tag_name):
            if element is None: return None
            for child in element:
                if child.tag.split('}')[-1] == tag_name:
                    return child
            return None

        info = find_el(root, "info")
        area = find_el(info, "area")

        polygon_str = find_text(area, "polygon")
        geom = None
        if polygon_str:
            try:
                # CAP polygons are space-separated lat,lon pairs
                points = []
                for pt in polygon_str.split():
                    lat, lon = pt.split(',')
                    points.append((float(lon), float(lat))) # PostGIS expects lon, lat
                if len(points) >= 3:
                    geom = f"POLYGON(({','.join([f'{p[0]} {p[1]}' for p in points])}))"
            except Exception as pe:
                logger.warning(f"Failed to parse polygon {polygon_str}: {pe}")

        parsed = {
            "identifier": find_text(root, "identifier"),
            "sender": find_text(root, "sender"),
            "sent": _parse_datetime(find_text(root, "sent")),
            "status": find_text(root, "status"),
            "msg_type": find_text(root, "msgType"),
            "category": find_text(info, "category"),
            "event": find_text(info, "event"),
            "urgency": find_text(info, "urgency"),
            "severity": find_text(info, "severity"),
            "certainty": find_text(info, "certainty"),
            "onset": _parse_datetime(find_text(info, "onset")),
            "expires": _parse_datetime(find_text(info, "expires")),
            "description": find_text(info, "description"),
            "instruction": find_text(info, "instruction"),
            "area_description": find_text(area, "areaDesc"),
            "polygon": geom,
            "raw_xml": xml_bytes.decode('utf-8', errors='replace'),
        }
        return parsed
    except Exception as e:
        logger.error(f"Error parsing CAP XML: {e}")
        return None

def ingest_sachet_alerts():
    """Fetches all RSS alerts, downloads missing CAP XMLs, and upserts them into DB."""
    if SessionLocal is None:
        logger.error("Database connection not configured.")
        return

    rss_alerts = fetch_sachet_rss()
    db: Session = SessionLocal()
    
    try:
        for alert_meta in rss_alerts:
            cap_url = alert_meta['cap_url']
            
            # Simple check if identifier already exists by extracting identifier from URL
            # URL format: ...?identifier=1790450220977016
            identifier = None
            if "identifier=" in cap_url:
                identifier = cap_url.split("identifier=")[-1].split("&")[0]
            
            if identifier:
                exists = db.query(SachetAlert).filter(SachetAlert.identifier == identifier).first()
                if exists:
                    continue
            
            try:
                response = requests.get(cap_url, headers=HEADERS, timeout=30)
                if response.status_code == 200:
                    cap_data = parse_cap_alert(response.content, cap_url)
                    if cap_data and cap_data['identifier']:
                        alert = SachetAlert(**cap_data)
                        db.merge(alert) # Merge will insert or update based on PK (we don't have PK, so let's check by identifier again)
                        db.commit()
                        logger.info(f"Ingested alert: {cap_data['identifier']} - {cap_data['event']}")
            except Exception as e:
                logger.error(f"Error fetching/ingesting {cap_url}: {e}")
                db.rollback()
                
    finally:
        db.close()

if __name__ == "__main__":
    ingest_sachet_alerts()
