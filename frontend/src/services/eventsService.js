import api from './api';

export const eventsService = {
  // Get 15 canonical Uttarakhand disaster events
  getHistoricalEvents: (params = {}) => api.get('/historical-events', { params }),

  // Get specific disaster event profile
  getEventById: (eventId) => api.get(`/historical-events/${eventId}`),
};

export default eventsService;
