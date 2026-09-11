import api from './api';

export const riskService = {
  // Get latest multi-signal risk decisions across Uttarakhand
  getLatestDecisions: (params = {}) => api.get('/risk/latest', { params }),

  // Get state-wide executive risk summary
  getRiskSummary: () => api.get('/risk/summary'),

  // Get active WARNING and CRITICAL priority alerts
  getActiveAlerts: () => api.get('/risk/alerts'),

  // Get auditable Policy v8.1.0 configuration
  getRiskPolicy: () => api.get('/risk/policy'),

  // Get decision for a specific station
  getStationDecision: (stationId) => api.get(`/risk/${stationId}`),

  // Get sequential time-series risk evaluations
  getRiskTimeseries: (spatialId, limit = 50) =>
    api.get('/risk/timeseries', { params: { spatial_id: spatialId, limit } }),

  // On-demand live evaluation
  evaluateLive: (payload) => api.post('/risk/evaluate', payload),
};

export default riskService;
