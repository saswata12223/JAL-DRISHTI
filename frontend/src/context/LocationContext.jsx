import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * LocationContext — Pan-India geographic selection state.
 * 
 * Holds the user's current administrative drill-down:
 *   India → State/UT → District → Subdistrict
 * 
 * Capability flags are derived from the GIS admin resolve API
 * and are keyed by state name to determine what is actually available.
 */

const LocationContext = createContext(null);

// Regions where ML model output is actually available (Uttarakhand only)
const ML_AVAILABLE_STATES = new Set(['Uttarakhand']);

// SIH26192 Scope Definition
const SIH_TIER1 = new Set(['Uttarakhand', 'Himachal Pradesh', 'Jammu & Kashmir', 'Ladakh', 'Sikkim', 'Arunachal Pradesh']);
const SIH_TIER2 = new Set(['Meghalaya', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Assam']);
const SIH_TIER4 = new Set(['Kerala', 'Karnataka', 'Goa', 'Maharashtra', 'Tamil Nadu']);

/**
 * Derives what capabilities are available for a given selection.
 */
export function deriveCapabilities(state = null, district = null) {
  const gisAvailable = true; // SOI dataset covers all of India
  const mlAvailable = state ? ML_AVAILABLE_STATES.has(state) : false;
  const liveAvailable = true; // OpenWeather map covers all of India!
  
  let sihStatus = 'NO';
  let sihReason = 'Not in SIH26192 core scope';
  if (state) {
    if (SIH_TIER1.has(state)) {
      sihStatus = 'YES';
      sihReason = 'Core Himalayan Flash-Flood Region';
    } else if (SIH_TIER2.has(state)) {
      sihStatus = 'YES';
      sihReason = 'North-East Hilly Expansion Region';
    } else if (state === 'West Bengal' && (district === 'Darjeeling' || district === 'Kalimpong')) {
      sihStatus = 'YES';
      sihReason = 'Sub-Himalayan Scope';
    } else if (SIH_TIER4.has(state)) {
      sihStatus = 'PARTIAL';
      sihReason = 'Western Ghats Terrain (Future Expansion)';
    }
  }

  return {
    gis: { available: true, reason: 'Survey of India administrative boundaries' },
    sih_region: { available: sihStatus, reason: sihReason },
    historical_ml: { available: mlAvailable, reason: mlAvailable ? 'XGBoost calibrated reference (Uttarakhand)' : 'Model coverage limited to Uttarakhand project area' },
    live_weather: { available: liveAvailable, reason: liveAvailable ? 'OpenWeatherMap — verified live source' : 'No verified weather source for this region' },
    live_telemetry: { available: false, reason: 'CWC gauge data unavailable — no verified API connection' },
    ml_live_inference: { available: false, reason: 'BLOCKED_LIVE_TELEMETRY — insufficient verified sensor data' },
  };
}

export const LocationProvider = ({ children }) => {
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);

  const selectState = useCallback((stateName, coords = null) => {
    setSelectedState(stateName);
    setSelectedDistrict(null);
    setSelectedSubdistrict(null);
    if (coords) setSelectedCoords(coords);
  }, []);

  const selectDistrict = useCallback((districtName, coords = null) => {
    setSelectedDistrict(districtName);
    setSelectedSubdistrict(null);
    if (coords) setSelectedCoords(coords);
  }, []);

  const selectSubdistrict = useCallback((subdistrictName, coords = null) => {
    setSelectedSubdistrict(subdistrictName);
    if (coords) setSelectedCoords(coords);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedSubdistrict(null);
    setSelectedCoords(null);
  }, []);

  const capabilities = deriveCapabilities(selectedState, selectedDistrict);

  const breadcrumb = [
    { label: 'India', onClick: clearSelection, active: !selectedState },
    selectedState ? { label: selectedState, onClick: () => { setSelectedDistrict(null); setSelectedSubdistrict(null); setSelectedCoords(null); }, active: !selectedDistrict } : null,
    selectedDistrict ? { label: selectedDistrict, onClick: () => { setSelectedSubdistrict(null); }, active: !selectedSubdistrict } : null,
    selectedSubdistrict ? { label: selectedSubdistrict, onClick: null, active: true } : null,
  ].filter(Boolean);

  return (
    <LocationContext.Provider value={{
      selectedState,
      selectedDistrict,
      selectedSubdistrict,
      selectedCoords,
      capabilities,
      breadcrumb,
      selectState,
      selectDistrict,
      selectSubdistrict,
      clearSelection,
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used inside LocationProvider');
  return ctx;
};
