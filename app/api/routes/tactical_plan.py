from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
import logging

from app.db.database import get_db
from app.db.models.sachet_alert import SachetAlert

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/{state_name}")
def get_tactical_plan(state_name: str, db: Session = Depends(get_db)):
    """
    Retrieves the tactical plan for a given state based on real verified disaster alerts (SACHET).
    """
    # For now, we filter alerts where the area_description contains the state name.
    # In a full PostGIS implementation, we would use ST_Intersects with the state geometry.
    
    alerts_query = db.query(SachetAlert).filter(
        or_(
            SachetAlert.area_description.ilike(f"%{state_name}%"),
            # Some alerts might be statewide or just generic, this is a basic text fallback
        )
    ).all()
    
    formatted_alerts = []
    for a in alerts_query:
        formatted_alerts.append({
            "identifier": a.identifier,
            "sender": a.sender,
            "event": a.event,
            "severity": a.severity,
            "urgency": a.urgency,
            "certainty": a.certainty,
            "issued_at": a.sent.isoformat() if a.sent else None,
            "expires": a.expires.isoformat() if a.expires else None,
            "area_description": a.area_description,
            "instruction": a.instruction
        })
    
    # Adhering to the architecture requested: returning real verified alerts only for now
    return {
        "state": state_name,
        "source": "NDMA SACHET",
        "alerts": formatted_alerts
    }
