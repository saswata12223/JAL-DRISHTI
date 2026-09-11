import axios from 'axios';

const API_BASE_URL = '/api/v1';

export const hardwareService = {
  /**
   * Fetch current hardware telemetry, actuator status, risk state, and event log.
   */
  getHardwareStatus: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hardware/status`);
      return response.data;
    } catch (error) {
      console.error('[hardwareService] Error fetching hardware status:', error);
      throw error;
    }
  },

  /**
   * Send a test command to trigger the ESP32 physical buzzer actuator.
   */
  triggerTestBuzzer: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/hardware/buzzer/test`);
      return response.data;
    } catch (error) {
      console.error('[hardwareService] Error sending test buzzer command:', error);
      throw error;
    }
  },

  /**
   * Send ESP32 buzzer acknowledgement signal.
   */
  acknowledgeBuzzer: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/hardware/buzzer/acknowledge`);
      return response.data;
    } catch (error) {
      console.error('[hardwareService] Error acknowledging buzzer:', error);
      throw error;
    }
  },

  /**
   * Send telemetry data payload directly from client/simulator.
   */
  sendTelemetry: async (payload) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/hardware/telemetry`, payload);
      return response.data;
    } catch (error) {
      console.error('[hardwareService] Error posting telemetry:', error);
      throw error;
    }
  },
};

export default hardwareService;
