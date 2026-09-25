import api from './api';

const liveAnomalyService = {
  getOverview: async () => {
    try {
      const response = await api.get('/live/overview');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching live anomaly overview:', error);
      return {
        success: false,
        detail: error.response?.data?.detail || 'Failed to fetch overview',
      };
    }
  },

  getAnomalies: async (limit = 100) => {
    try {
      const response = await api.get('/live/anomalies', { params: { limit } });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching live anomalies:', error);
      return {
        success: false,
        detail: error.response?.data?.detail || 'Failed to fetch anomalies',
      };
    }
  },
};

export default liveAnomalyService;
