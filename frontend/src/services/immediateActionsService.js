import api from './api';

export const immediateActionsService = {
  // Return rich mock data since backend endpoint is missing/not-implemented yet
  getTacticalPlan: async () => {
    return {
      data: {
        forces: [
          { id: 'F1', organization: 'NDRF', battalion: '8th Battalion', base_name: 'Srinagar Base', district: 'Pauri Garhwal', lat: 30.22, lon: 78.78, mobilization_status: 'DEPLOYED', personnel_count: 120, motorized_boats: 8, drone_surveillance_units: 3, assigned_zone: 'Alaknanda Valley', commanding_officer: 'Cmdr. R. Singh' },
          { id: 'F2', organization: 'SDRF', battalion: 'Quick Response Team', base_name: 'Gauchar Camp', district: 'Chamoli', lat: 30.28, lon: 79.15, mobilization_status: 'STANDBY', personnel_count: 45, motorized_boats: 2, drone_surveillance_units: 1, assigned_zone: 'Mandakini Confluence', commanding_officer: 'Capt. A. Rawat' }
        ],
        ingress_routes: [
          { id: 'ROUTE-NH07', name: 'Alpha Corridor (NH-07)', entry_point: 'Rishikesh Base', destination: 'Srinagar Sector', clearance_capacity: 'Heavy Machinery / Convoy', total_distance_km: 105, status: 'OPEN', path_coordinates: [[30.1, 78.3], [30.15, 78.5], [30.22, 78.78]] },
          { id: 'ROUTE-NH107', name: 'Bravo Corridor (NH-107)', entry_point: 'Rudraprayag', destination: 'Kedarnath Valley', clearance_capacity: 'Light 4x4 / Foot', total_distance_km: 75, status: 'RESTRICTED', path_coordinates: [[30.28, 78.98], [30.45, 79.05], [30.73, 79.06]] }
        ],
        vulnerable_points: [
          { id: 'V1', name: 'Sirobagarh Landslide Zone', hazard_type: 'LANDSLIDE', risk_severity: 'EXTREME', lat: 30.25, lon: 78.85, vulnerability_desc: 'Chronic landslide bottleneck blocking NH-07.', mitigation: 'Dozer stationed at km 14.' },
          { id: 'V2', name: 'Sonprayag Bridge', hazard_type: 'RIVER_BREACH', risk_severity: 'HIGH', lat: 30.63, lon: 78.99, vulnerability_desc: 'Bridge structural integrity compromised by surging river.', mitigation: 'Traffic halted. Aerial bypass active.' }
        ],
        population_centers: [
          { id: 'P1', name: 'Rudraprayag Town', district: 'Rudraprayag', lat: 30.28, lon: 78.98, approx_population: 15400, vulnerable_riverfront_population: 3200, pilgrim_floating_headcount: 5000, risk_level: 'EXTREME', safe_shelter_target: 'Degree College Relief Camp', egress_protocol: 'Uphill via Temple Road' },
          { id: 'P2', name: 'Gauchar', district: 'Chamoli', lat: 30.28, lon: 79.15, approx_population: 9800, vulnerable_riverfront_population: 1100, pilgrim_floating_headcount: 800, risk_level: 'HIGH', safe_shelter_target: 'ITBP Helipad Ground', egress_protocol: 'Move towards airstrip perimeter' }
        ],
        safe_shortest_routes: [
          { from_point_id: 'P1', from_name: 'Rudraprayag Town', to_shelter_name: 'Degree College Relief Camp', shortest_distance_km: 2.5, est_foot_hours: 0.8, est_rescue_vehicle_mins: 12, elevation_change_m: 150, safety_score: '98% SAFE', hazard_avoidance: 'Avoids lower bazaar riverfront.', waypoints: [[30.28, 78.98], [30.285, 78.985], [30.29, 78.99]] }
        ],
        shelters: [
          { id: 'S1', name: 'Degree College Relief Camp', type: 'EDUCATIONAL', district: 'Rudraprayag', lat: 30.29, lon: 78.99, max_capacity: 1500, current_occupancy: 450, status: 'OPEN', supplies: { drinking_water_days: 5, food_rations_days: 7, emergency_blankets: 2000, medical_team_on_site: true }, last_message_received: 'Send more blankets', last_response_sent: 'Dispatched via convoy' }
        ],
        sosAlerts: [
          { id: 'SOS1', sender_id: 'USR-992', name: 'Anil Kumar', phone: '9876543210', timestamp: new Date().toISOString(), latitude: 30.27, longitude: 78.97, distress_type: 'Trapped by water', message: 'Water entering ground floor, need boat rescue.', people_trapped: 4, battery: 15, mesh_hops: 2, status: 'ACTIVE' }
        ]
      }
    };
  },

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
