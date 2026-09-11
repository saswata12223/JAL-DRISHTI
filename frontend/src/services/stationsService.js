import api from './api';

export const stationsService = {
  // Get all monitored stations (20 CWC + 155 IMD)
  getStations: (params = {}) => api.get('/stations', { params }),

  // Get specific station details
  getStationById: (stationId) => api.get(`/stations/${stationId}`),
};

export default stationsService;
