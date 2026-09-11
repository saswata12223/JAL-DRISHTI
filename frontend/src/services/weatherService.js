import api from './api';

/**
 * Service to fetch live weather observations and forecasts via Jal Drishti FastAPI backend proxy.
 * Note: Never calls OpenWeather directly from browser to protect API key security.
 */
export const weatherService = {
  /**
   * Fetch current weather observations for a given location or coordinates.
   * @param {number} [lat] - Latitude in decimal degrees
   * @param {number} [lon] - Longitude in decimal degrees
   * @param {string} [locationName] - Optional display name for the location
   */
  async getCurrentWeather(lat, lon, locationName) {
    try {
      const params = {};
      if (lat !== undefined && lat !== null) params.lat = lat;
      if (lon !== undefined && lon !== null) params.lon = lon;
      if (locationName) params.location = locationName;

      const data = await api.get('/weather/current', { params });
      return data;
    } catch (error) {
      console.warn('[WeatherService] Current weather fetch error:', error?.message || error);
      return {
        success: false,
        status: 'NETWORK_ERROR',
        detail: 'Unable to reach Jal Drishti backend weather service.',
        weather_source: 'OpenWeather',
      };
    }
  },

  /**
   * Fetch hourly and daily forecast summaries for a given location or coordinates.
   * @param {number} [lat] - Latitude in decimal degrees
   * @param {number} [lon] - Longitude in decimal degrees
   * @param {string} [locationName] - Optional display name for the location
   */
  async getWeatherForecast(lat, lon, locationName) {
    try {
      const params = {};
      if (lat !== undefined && lat !== null) params.lat = lat;
      if (lon !== undefined && lon !== null) params.lon = lon;
      if (locationName) params.location = locationName;

      const data = await api.get('/weather/forecast', { params });
      return data;
    } catch (error) {
      console.warn('[WeatherService] Weather forecast fetch error:', error?.message || error);
      return {
        success: false,
        status: 'NETWORK_ERROR',
        detail: 'Unable to reach Jal Drishti backend weather service.',
        weather_source: 'OpenWeather',
      };
    }
  },
};

export default weatherService;
