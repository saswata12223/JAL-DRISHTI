import api from './api';

export const predictionsService = {
  // Get latest ML & physics predictions
  getLatestPredictions: (params = {}) => api.get('/predictions/latest', { params }),

  // Run on-demand ML model inference + SCS-CN physics
  infer: (payload) => api.post('/predictions/infer', payload),
};

export default predictionsService;
