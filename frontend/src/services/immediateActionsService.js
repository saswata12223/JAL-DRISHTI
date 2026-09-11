import api from './api';

export const immediateActionsService = {
  // Get complete tactical force deployment, corridors, bottlenecks, and routes
  getTacticalPlan: () => api.get('/immediate-actions/tactical-plan'),

  // Automated Twilio Voice Call Outbound Dispatch
  dispatchVoiceCalls: (payload) => api.post('/immediate-actions/call/dispatch', payload),

  // Automated SMS Emergency Dissemination
  dispatchSmsAlerts: (payload) => api.post('/immediate-actions/sms/dispatch', payload),

  // Automated WhatsApp Emergency Dissemination
  dispatchWhatsAppAlerts: (payload) => api.post('/immediate-actions/whatsapp/dispatch', payload),

  // Get Live Mobile SOS Alerts Feed
  getSosAlerts: (params = {}) => api.get('/immediate-actions/sos', { params }),

  // Mobile App SOS Distress Inbound Webhook Simulation
  submitMobileSos: (payload) => api.post('/immediate-actions/sos', payload),

  // Update SOS Status (Dispatch Rescue Unit / Resolve)
  updateSosStatus: (sosId, payload) => api.patch(`/immediate-actions/sos/${sosId}/status`, payload),

  // Get Statewide Shelter Registry with Real-Time Availability
  getShelters: () => api.get('/immediate-actions/shelters'),

  // Broadcast Message to Shelter
  broadcastToShelter: (shelterId) => api.post(`/immediate-actions/shelters/${shelterId}/broadcast`),

  // Shelter Availability Response
  updateShelterAvailability: (shelterId, payload) =>
    api.post(`/immediate-actions/shelters/${shelterId}/availability`, payload),
};

export default immediateActionsService;
