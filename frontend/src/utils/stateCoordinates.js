export const SEARCH_INDEX = [
  // Tier 1: Core Himalayan
  { label: 'Uttarakhand', type: 'State', lat: 30.15, lon: 79.2, state: 'Uttarakhand', district: null, mlAvailable: true },
  { label: 'Himachal Pradesh', type: 'State', lat: 31.6, lon: 77.1, state: 'Himachal Pradesh', district: null, mlAvailable: true },
  { label: 'Jammu & Kashmir', type: 'UT', lat: 33.7, lon: 76.9, state: 'Jammu & Kashmir', district: null, mlAvailable: true },
  { label: 'Ladakh', type: 'UT', lat: 34.2, lon: 77.6, state: 'Ladakh', district: null, mlAvailable: true },
  { label: 'Sikkim', type: 'State', lat: 27.5, lon: 88.5, state: 'Sikkim', district: null, mlAvailable: true },
  { label: 'Arunachal Pradesh', type: 'State', lat: 28.2, lon: 94.7, state: 'Arunachal Pradesh', district: null, mlAvailable: true },

  // Tier 2: North-East Hills
  { label: 'Meghalaya', type: 'State', lat: 25.5, lon: 91.4, state: 'Meghalaya', district: null, mlAvailable: true },
  { label: 'Nagaland', type: 'State', lat: 26.2, lon: 94.6, state: 'Nagaland', district: null, mlAvailable: true },
  { label: 'Manipur', type: 'State', lat: 24.7, lon: 93.9, state: 'Manipur', district: null, mlAvailable: true },
  { label: 'Mizoram', type: 'State', lat: 23.2, lon: 92.9, state: 'Mizoram', district: null, mlAvailable: true },
  { label: 'Tripura', type: 'State', lat: 23.8, lon: 91.3, state: 'Tripura', district: null, mlAvailable: true },
  { label: 'Assam', type: 'State', lat: 26.2, lon: 92.9, state: 'Assam', district: null, mlAvailable: true },

  // Tier 3: Sub-Himalayan
  { label: 'West Bengal', type: 'State', lat: 22.5, lon: 87.3, state: 'West Bengal', district: null, mlAvailable: true },

  // Tier 4: Western Ghats Terrain
  { label: 'Maharashtra', type: 'State', lat: 19.6, lon: 75.3, state: 'Maharashtra', district: null, mlAvailable: true },
  { label: 'Goa', type: 'State', lat: 15.3, lon: 74.0, state: 'Goa', district: null, mlAvailable: true },
  { label: 'Karnataka', type: 'State', lat: 15.3, lon: 75.7, state: 'Karnataka', district: null, mlAvailable: true },
  { label: 'Kerala', type: 'State', lat: 10.5, lon: 76.3, state: 'Kerala', district: null, mlAvailable: true },
  { label: 'Tamil Nadu', type: 'State', lat: 11.1, lon: 78.7, state: 'Tamil Nadu', district: null, mlAvailable: true },

  // --- DISTRICTS ---
  // Uttarakhand districts
  { label: 'Dehradun', type: 'District', lat: 30.32, lon: 78.03, state: 'Uttarakhand', district: 'Dehradun', mlAvailable: true },
  { label: 'Haridwar', type: 'District', lat: 29.94, lon: 78.16, state: 'Uttarakhand', district: 'Haridwar', mlAvailable: true },
  { label: 'Chamoli', type: 'District', lat: 30.4, lon: 79.3, state: 'Uttarakhand', district: 'Chamoli', mlAvailable: true },
  { label: 'Rudraprayag', type: 'District', lat: 30.28, lon: 78.98, state: 'Uttarakhand', district: 'Rudraprayag', mlAvailable: true },
  { label: 'Pithoragarh', type: 'District', lat: 29.58, lon: 80.22, state: 'Uttarakhand', district: 'Pithoragarh', mlAvailable: true },
  { label: 'Uttarkashi', type: 'District', lat: 30.73, lon: 78.44, state: 'Uttarakhand', district: 'Uttarkashi', mlAvailable: true },
  { label: 'Tehri Garhwal', type: 'District', lat: 30.4, lon: 78.5, state: 'Uttarakhand', district: 'Tehri Garhwal', mlAvailable: true },

  // Sub-Himalayan Districts
  { label: 'Darjeeling', type: 'District', lat: 27.04, lon: 88.26, state: 'West Bengal', district: 'Darjeeling' },
  { label: 'Kalimpong', type: 'District', lat: 27.06, lon: 88.47, state: 'West Bengal', district: 'Kalimpong' },

  // Tier 4 Districts
  { label: 'Bengaluru Urban', type: 'District', lat: 12.97, lon: 77.59, state: 'Karnataka', district: 'Bengaluru Urban' },
  { label: 'Mumbai', type: 'District', lat: 19.08, lon: 72.88, state: 'Maharashtra', district: 'Mumbai' },
  { label: 'Pune', type: 'District', lat: 18.52, lon: 73.86, state: 'Maharashtra', district: 'Pune' },
  { label: 'Chennai', type: 'District', lat: 13.08, lon: 80.27, state: 'Tamil Nadu', district: 'Chennai' },
  { label: 'Thiruvananthapuram', type: 'District', lat: 8.52, lon: 76.93, state: 'Kerala', district: 'Thiruvananthapuram' },
  { label: 'Ernakulam', type: 'District', lat: 9.98, lon: 76.29, state: 'Kerala', district: 'Ernakulam' },
  { label: 'Kozhikode', type: 'District', lat: 11.25, lon: 75.78, state: 'Kerala', district: 'Kozhikode' },
  { label: 'Wayanad', type: 'District', lat: 11.68, lon: 76.13, state: 'Kerala', district: 'Wayanad' },
  { label: 'Idukki', type: 'District', lat: 9.85, lon: 76.97, state: 'Kerala', district: 'Idukki' }
];

export const getLocationCoordinates = (state, district) => {
  if (district) {
    const d = SEARCH_INDEX.find(item => item.state === state && item.district === district);
    if (d) return { lat: d.lat, lon: d.lon };
  }
  if (state) {
    const s = SEARCH_INDEX.find(item => item.state === state && !item.district);
    if (s) return { lat: s.lat, lon: s.lon };
  }
  // Default to India Center
  return { lat: 20.5937, lon: 78.9629 };
};
