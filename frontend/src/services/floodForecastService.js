import api from './api';

export const floodForecastService = {
  // Get latest real-time flood forecast summary and probability
  getLatestForecast: () => api.get('/flood/forecast/latest'),

  // Get rolling rainfall history and forecast trend (last 15m, 1h, etc.)
  getRainfallHistory: (windowMinutes = 60) =>
    api.get('/flood/history', { params: { window_minutes: windowMinutes } }),

  // On-demand supervised ML inference with custom features
  predictFloodRisk: (payload) => api.post('/flood/predict', payload),

  // Direct ingestion of Arduino raw rain sensor observations
  ingestTelemetry: (payload) => api.post('/flood/telemetry', payload),
};

export default floodForecastService;
