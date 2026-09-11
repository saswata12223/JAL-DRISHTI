import api from './api';

export const observationsService = {
  // Get latest telemetry observations
  getLatestObservations: (params = {}) => api.get('/observations/latest', { params }),

  // Get historical time series observations
  getTimeseries: (stationId, limit = 48) =>
    api.get('/observations/timeseries', { params: { station_id: stationId, limit } }),
};

export default observationsService;
