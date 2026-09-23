const API_BASE = 'http://localhost:8000/api/v1/ffews';

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
