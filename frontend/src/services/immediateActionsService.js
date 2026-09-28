import api from './api';

export const immediateActionsService = {
  getTacticalPlan: (stateName = 'Uttarakhand') => api.get(`/tactical-plan/${stateName}`),

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
  // Uses a singleton EventSource so React StrictMode double-mount doesn't kill the connection.
  subscribeToSosStream: (() => {
    let es = null;          // The single shared EventSource
    let listeners = [];     // All active React subscriber callbacks

    function ensureConnected() {
      if (es && es.readyState !== EventSource.CLOSED) return;

      es = new EventSource('/api/v1/sos/stream');

      es.addEventListener('new_sos', (e) => {
        const data = JSON.parse(e.data);
        listeners.forEach((fn) => fn('new_sos', data));
      });

      es.addEventListener('update_sos', (e) => {
        const data = JSON.parse(e.data);
        listeners.forEach((fn) => fn('update_sos', data));
      });

      es.addEventListener('ping', () => { /* heartbeat, keep alive */ });

      es.onerror = () => {
        // Browser will auto-reconnect; log only when actually closed
        if (es.readyState === EventSource.CLOSED) {
          console.warn('[SSE] Connection closed — will reconnect on next subscribe.');
          es = null;
        }
      };
    }

    return function subscribe(onMessage) {
      listeners.push(onMessage);
      ensureConnected();

      // Cleanup: remove this listener but KEEP the EventSource alive for other subscribers
      return () => {
        listeners = listeners.filter((fn) => fn !== onMessage);
        // Only fully close when nobody is listening
        if (listeners.length === 0 && es) {
          es.close();
          es = null;
        }
      };
    };
  })(),

  // Get Statewide Shelter Registry with Real-Time Availability
  getShelters: async () => {
    return {
      data: [
        { id: 'S1', name: 'Degree College Relief Camp', type: 'EDUCATIONAL', district: 'Rudraprayag', lat: 30.29, lon: 78.99, max_capacity: 1500, current_occupancy: 450, status: 'OPEN', supplies: { drinking_water_days: 5, food_rations_days: 7, emergency_blankets: 2000, medical_team_on_site: true }, last_message_received: 'Send more blankets', last_response_sent: 'Dispatched via convoy' },
        { id: 'S2', name: 'ITBP Helipad Ground', type: 'MILITARY', district: 'Chamoli', lat: 30.28, lon: 79.15, max_capacity: 800, current_occupancy: 780, status: 'FULL', supplies: { drinking_water_days: 2, food_rations_days: 2, emergency_blankets: 50, medical_team_on_site: true }, last_message_received: 'Capacity maxed out', last_response_sent: 'Diverting evacuees to S3' }
      ]
    };
  },

  // Broadcast Message to Shelter
  broadcastToShelter: (shelterId) => api.post(`/immediate-actions/shelters/${shelterId}/broadcast`),

  // Shelter Availability Response
  updateShelterAvailability: (shelterId, payload) =>
    api.post(`/immediate-actions/shelters/${shelterId}/availability`, payload),
};

export default immediateActionsService;
