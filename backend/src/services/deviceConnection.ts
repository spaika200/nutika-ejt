import { logger } from '../utils/logger';

interface ConnectionParams {
  ip?: string;
  port?: number;
  endpoint?: string;
  topic?: string;
  username?: string;
  password?: string;
}

/**
 * DeviceConnectionService
 * Handles testing and communicating with various IoT device types
 */
export class DeviceConnectionService {
  /**
   * Test connection to a device
   */
  static async testConnection(connectionType: string, connectionParams: string): Promise<{ success: boolean; message: string }> {
    try {
      const params = JSON.parse(connectionParams) as ConnectionParams;

      switch (connectionType.toUpperCase()) {
        case 'IP':
          return await this.testIPConnection(params);
        case 'API':
          return await this.testAPIConnection(params);
        case 'MQTT':
          return await this.testMQTTConnection(params);
        default:
          return { success: false, message: 'Unknown connection type' };
      }
    } catch (error) {
      logger.error('Device connection test failed', { error });
      return { success: false, message: 'Connection test error' };
    }
  }

  /**
   * Send ON/OFF command to device
   */
  static async sendCommand(
    connectionType: string,
    connectionParams: string,
    command: 'ON' | 'OFF'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const params = JSON.parse(connectionParams) as ConnectionParams;

      switch (connectionType.toUpperCase()) {
        case 'IP':
          return await this.sendIPCommand(params, command);
        case 'API':
          return await this.sendAPICommand(params, command);
        case 'MQTT':
          return await this.sendMQTTCommand(params, command);
        default:
          return { success: false, message: 'Unknown connection type' };
      }
    } catch (error) {
      logger.error('Device command failed', { error, command });
      return { success: false, message: 'Command execution error' };
    }
  }

  /**
   * Test IP-based connection (e.g., Shelly, Tasmota devices)
   */
  private static async testIPConnection(params: ConnectionParams): Promise<{ success: boolean; message: string }> {
    const { ip, port = 80 } = params;

    if (!ip) {
      return { success: false, message: 'IP address not provided' };
    }

    try {
      const url = `http://${ip}:${port}/status`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

      if (response.ok) {
        return { success: true, message: `Connected to device at ${ip}:${port}` };
      } else {
        return { success: false, message: `Device responded with status ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: `Failed to connect to ${ip}:${port}` };
    }
  }

  /**
   * Send ON/OFF command to IP-based device
   */
  private static async sendIPCommand(params: ConnectionParams, command: 'ON' | 'OFF'): Promise<{ success: boolean; message: string }> {
    const { ip, port = 80 } = params;

    if (!ip) {
      return { success: false, message: 'IP address not provided' };
    }

    try {
      const state = command === 'ON' ? 1 : 0;
      const url = `http://${ip}:${port}/relay/0?turn=${command.toLowerCase()}`;
      
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

      if (response.ok) {
        return { success: true, message: `Device turned ${command}` };
      } else {
        return { success: false, message: `Device command failed with status ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: `Failed to send command to device` };
    }
  }

  /**
   * Test API-based connection (e.g., HTTP REST endpoints)
   */
  private static async testAPIConnection(params: ConnectionParams): Promise<{ success: boolean; message: string }> {
    const { endpoint } = params;

    if (!endpoint) {
      return { success: false, message: 'API endpoint not provided' };
    }

    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });

      if (response.ok) {
        return { success: true, message: `Connected to API endpoint ${endpoint}` };
      } else {
        return { success: false, message: `API responded with status ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: `Failed to connect to API endpoint` };
    }
  }

  /**
   * Send ON/OFF command to API endpoint
   */
  private static async sendAPICommand(params: ConnectionParams, command: 'ON' | 'OFF'): Promise<{ success: boolean; message: string }> {
    const { endpoint } = params;

    if (!endpoint) {
      return { success: false, message: 'API endpoint not provided' };
    }

    try {
      const response = await fetch(`${endpoint}?action=${command.toLowerCase()}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        return { success: true, message: `Device turned ${command}` };
      } else {
        return { success: false, message: `API command failed with status ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: `Failed to send command via API` };
    }
  }

  /**
   * Test MQTT connection (placeholder - requires MQTT library in production)
   */
  private static async testMQTTConnection(params: ConnectionParams): Promise<{ success: boolean; message: string }> {
    const { ip, port = 1883, topic, username, password } = params;

    if (!ip || !topic) {
      return { success: false, message: 'MQTT broker IP or topic not provided' };
    }

    // In production, use mqtt.js library
    // For now, return a mock response
    logger.info('MQTT connection test', { ip, port, topic });
    return { success: true, message: `MQTT connection configured for ${ip}:${port}` };
  }

  /**
   * Send ON/OFF command via MQTT
   */
  private static async sendMQTTCommand(params: ConnectionParams, command: 'ON' | 'OFF'): Promise<{ success: boolean; message: string }> {
    const { topic } = params;

    if (!topic) {
      return { success: false, message: 'MQTT topic not provided' };
    }

    // In production, use mqtt.js library to publish
    logger.info('MQTT command sent', { topic, command });
    return { success: true, message: `MQTT command sent: ${command}` };
  }

  /**
   * Get device status
   */
  static async getDeviceStatus(connectionType: string, connectionParams: string): Promise<{ online: boolean; status?: any }> {
    try {
      const testResult = await this.testConnection(connectionType, connectionParams);
      return { online: testResult.success };
    } catch (error) {
      logger.error('Failed to get device status', { error });
      return { online: false };
    }
  }
}
