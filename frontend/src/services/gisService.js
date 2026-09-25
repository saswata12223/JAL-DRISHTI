import api from './api';

const adminCache = new Map();

/**
 * Resolves the administrative geographic context (State, District, Sub-district, and Project Region)
 * for a given latitude and longitude using the verified backend Phase 18 GIS API.
 * 
 * Returns the new schema:
 * {
 *   coordinate, state, district, subdistrict,
 *   administrative_gis: { available, state_status, district_status, subdistrict_status },
 *   ml: { available, reason },
 *   live_telemetry: { available, reason },
 *   project_region: { region_id, status }
 * }
 */
export async function resolveAdminContext(lat, lon) {
  if (lat == null || lon == null) {
    return null;
  }

  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (adminCache.has(cacheKey)) {
    return adminCache.get(cacheKey);
  }

  try {
    const data = await api.get(`/gis/admin/resolve?latitude=${lat}&longitude=${lon}`);

    if (data && data.success) {
      adminCache.set(cacheKey, data.data);
      return data.data;
    } else {
      console.warn("GIS Admin API returned error:", data.detail || data);
      return null;
    }
  } catch (error) {
    console.error("GIS Admin Network/Fetch Error:", error);
    return null;
  }
}

/**
 * Returns the PAN-India administrative inventory (states + district counts).
 * Cached in-memory for session lifetime.
 */
let _regionsCache = null;
export async function listAdminRegions() {
  if (_regionsCache) return _regionsCache;
  try {
    const data = await api.get('/gis/admin/regions');
    if (data && data.success) {
      _regionsCache = data.data;
      return _regionsCache;
    }
    return null;
  } catch (error) {
    console.error('GIS listAdminRegions error:', error);
    return null;
  }
}

export default {
  resolveAdminContext,
  listAdminRegions,
};
