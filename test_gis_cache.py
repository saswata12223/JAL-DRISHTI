from fastapi import APIRouter
from app.core.gis import _load_admin_layer, _ADMIN_CACHE

# Let's inspect the fields in the state cache
_load_admin_layer('state')
cache = _ADMIN_CACHE['state']
states = set()
if 'STATE' in cache.fields:
    states.update([s for s in cache.fields['STATE'] if s])
elif 'STATE_UT' in cache.fields:
    states.update([s for s in cache.fields['STATE_UT'] if s])

print(list(states)[:5])

_load_admin_layer('district')
dcache = _ADMIN_CACHE['district']
districts = set()
if 'DISTRICT' in dcache.fields:
    districts.update([d for d in dcache.fields['DISTRICT'] if d])

print(list(districts)[:5])

