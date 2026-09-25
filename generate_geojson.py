from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from app.core.gis import _load_admin_layer, _ADMIN_CACHE
import shapely

# Let's create a standalone script to generate simplified GeoJSON and see how big it is
def generate_simplified_geojson():
    cache = _load_admin_layer('state')
    features = []
    
    state_fields = cache.fields
    state_col = 'STATE' if 'STATE' in state_fields else 'STATE_UT'
    
    for i, geom in enumerate(cache.geometries):
        if geom is None:
            continue
            
        # Simplify geometry for visualization (0.01 degrees is ~1km)
        simplified = geom.simplify(0.01, preserve_topology=True)
        
        props = {}
        if state_col in state_fields:
            props['name'] = str(state_fields[state_col][i]).strip() if state_fields[state_col][i] else "Unknown"
        
        # Convert shapely geom to GeoJSON geometry
        geom_json = shapely.geometry.mapping(simplified)
        
        features.append({
            "type": "Feature",
            "properties": props,
            "geometry": geom_json
        })
        
    return {
        "type": "FeatureCollection",
        "features": features
    }

import json
from pathlib import Path

geojson = generate_simplified_geojson()
out = Path("data/processed/gis/phase_pan_india/india_states_simplified.geojson")
with open(out, 'w') as f:
    json.dump(geojson, f)
    
print(f"Generated {out.name}, Size: {out.stat().st_size / 1024 / 1024:.2f} MB")
