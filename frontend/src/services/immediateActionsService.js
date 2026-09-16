import api from './api';

export const immediateActionsService = {
  // Get complete tactical force deployment, corridors, bottlenecks, and routes
  getTacticalPlan: () => api.get('/immediate-actions/tactical-plan'),

  // Automated Twilio Voice Call Outbound Dispatch
  dispatchVoiceCalls: (payload) => {
    const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
    const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
    const apiKey = import.meta.env.VITE_TWILIO_API_KEY || '';
    const fromNumber = import.meta.env.VITE_TWILIO_FROM_NUMBER || '';

    return api.post('/immediate-actions/call/dispatch', {
      auth_token: authToken,
      account_sid: accountSid,
      api_key: apiKey,
      from_number: fromNumber,
      ...payload,
    });
  },

  // Automated SMS Emergency Dissemination
  dispatchSmsAlerts: (payload) => api.post('/immediate-actions/sms/dispatch', payload),

  // Automated WhatsApp Emergency Dissemination
  dispatchWhatsAppAlerts: (payload) => api.post('/immediate-actions/whatsapp/dispatch', payload),

  // Get Live Mobile SOS Alerts Feed
  getSosAlerts: (params = {}) => api.get('/sos', { params }),

  // Mobile App SOS Distress Inbound Webhook Simulation
  submitMobileSos: (payload) => api.post('/sos/incoming', payload, {
    headers: {
      'X-Gateway-Key': 'gateway_secret_123'
    }
  }),

  // Update SOS Status (Dispatch Rescue Unit)
  dispatchSos: (sosId) => api.put(`/sos/${sosId}/dispatch`),
  
  // Update SOS Status (Acknowledge)
  acknowledgeSos: (sosId) => api.put(`/sos/${sosId}/acknowledge`),
  
  // Update SOS Status (Resolve)
  resolveSos: (sosId) => api.put(`/sos/${sosId}/resolve`),
  
  // Subscribe to real-time SOS stream via SSE
  subscribeToSosStream: (onMessage) => {
    // Determine the base URL for the EventSource
    // If we're using Vite's proxy in dev, it's just /api/v1/sos/stream
    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    const eventSource = new EventSource(`${baseUrl}/sos/stream`);
    
    eventSource.addEventListener('new_sos', (e) => {
      onMessage('new_sos', JSON.parse(e.data));
    });
    
    eventSource.addEventListener('update_sos', (e) => {
      onMessage('update_sos', JSON.parse(e.data));
    });
    
    eventSource.addEventListener('ping', () => {
      // Keep-alive heartbeat
    });
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };
    
    return () => {
      eventSource.close();
    };
  },

  // Get Statewide Shelter Registry with Real-Time Availability
  getShelters: () => api.get('/immediate-actions/shelters'),

  // Broadcast Message to Shelter
  broadcastToShelter: (shelterId) => api.post(`/immediate-actions/shelters/${shelterId}/broadcast`),

  // Shelter Availability Response
  updateShelterAvailability: (shelterId, payload) =>
    api.post(`/immediate-actions/shelters/${shelterId}/availability`, payload),
};

export default immediateActionsService;
