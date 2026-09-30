const API_BASE = '/api/v1/ffews';

export async function fetchFfewsTelemetry(lat, lon) {
  try {
    let url = `${API_BASE}/telemetry`;
    const params = new URLSearchParams();
    if (lat) params.append('lat', lat);
    if (lon) params.append('lon', lon);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch FFEWS telemetry data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('FFEWS Fetch Error:', error);
    return null;
  }
}

export async function sendFfewsSmsTest(message, to) {
  try {
    const response = await fetch(`${API_BASE}/test-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, to }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to send FFEWS SMS');
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('FFEWS SMS Error:', error);
    return { success: false, error: error.message };
  }
}
export const HILLY_REGIONS = [
  { id: 'shimla', name: 'Shimla, Himachal Pradesh', lat: 31.1048, lon: 77.1734 },
  { id: 'kedarnath', name: 'Kedarnath, Uttarakhand', lat: 30.7352, lon: 79.0669 },
  { id: 'srinagar', name: 'Srinagar, Jammu & Kashmir', lat: 34.0837, lon: 74.7973 },
  { id: 'gangtok', name: 'Gangtok, Sikkim', lat: 27.3389, lon: 88.6065 },
  { id: 'tawang', name: 'Tawang, Arunachal Pradesh', lat: 27.5860, lon: 91.8594 },
  { id: 'darjeeling', name: 'Darjeeling, West Bengal', lat: 27.0360, lon: 88.2627 },
  { id: 'shillong', name: 'Shillong, Meghalaya', lat: 25.5788, lon: 91.8933 },
  { id: 'munnar', name: 'Munnar, Kerala', lat: 10.0889, lon: 77.0595 },
  { id: 'mahabaleshwar', name: 'Mahabaleshwar, Maharashtra', lat: 17.9239, lon: 73.6538 },
];

export async function fetchAllFfewsRegions() {
  const promises = HILLY_REGIONS.map(async (region) => {
    const data = await fetchFfewsTelemetry(region.lat, region.lon);
    return { ...region, ...data };
  });
  return Promise.all(promises);
}

