const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

const execAsync = promisify(exec);

class DeviceManager {
  constructor(io) {
    this.io = io;
    this.devicesPath = path.join(__dirname, '../../data/devices.json');
    this.devices = new Map();
    this.loadDevices();
  }

  async loadDevices() {
    try {
      const data = await fs.readFile(this.devicesPath, 'utf8');
      const devicesArray = JSON.parse(data);
      this.devices = new Map(devicesArray.map(device => [device.id, device]));
    } catch (error) {
      logger.warn('No existing devices file found, starting with empty device list');
      this.devices = new Map();
    }
  }

  async saveDevices() {
    try {
      const devicesArray = Array.from(this.devices.values());
      await fs.writeFile(this.devicesPath, JSON.stringify(devicesArray, null, 2));
    } catch (error) {
      logger.error('Error saving devices:', error);
      throw error;
    }
  }

  async getAllDevices() {
    return Array.from(this.devices.values());
  }

  async getDevice(deviceId) {
    return this.devices.get(deviceId) || null;
  }

  async addDevice(deviceData) {
    const device = {
      id: this.generateDeviceId(),
      name: deviceData.name || 'Unknown Device',
      macAddress: deviceData.macAddress,
      ipAddress: deviceData.ipAddress,
      deviceType: deviceData.deviceType || 'unknown',
      manufacturer: deviceData.manufacturer || 'Unknown',
      isBlocked: false,
      isVPNClient: false,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      trafficStats: {
        bytesReceived: 0,
        bytesSent: 0,
        packetsReceived: 0,
        packetsSent: 0
      }
    };

    this.devices.set(device.id, device);
    await this.saveDevices();
    
    logger.info(`Device added: ${device.name} (${device.macAddress})`);
    this.io.emit('device-added', device);
    
    return device;
  }

  async updateDevice(deviceId, updateData) {
    const device = this.devices.get(deviceId);
    if (!device) {
      return null;
    }

    const updatedDevice = {
      ...device,
      ...updateData,
      lastModified: new Date().toISOString()
    };

    this.devices.set(deviceId, updatedDevice);
    await this.saveDevices();
    
    logger.info(`Device updated: ${updatedDevice.name}`);
    this.io.emit('device-updated', updatedDevice);
    
    return updatedDevice;
  }

  async deleteDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      return false;
    }

    this.devices.delete(deviceId);
    await this.saveDevices();
    
    logger.info(`Device deleted: ${device.name}`);
    this.io.emit('device-deleted', { id: deviceId });
    
    return true;
  }

  async getDeviceStatus(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      return null;
    }

    try {
      // Check if device is currently online
      const isOnline = await this.pingDevice(device.ipAddress);
      
      return {
        ...device,
        isOnline,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error checking device status for ${deviceId}:`, error);
      return {
        ...device,
        isOnline: false,
        lastChecked: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async blockDevice(deviceId, blocked) {
    const device = this.devices.get(deviceId);
    if (!device) {
      return null;
    }

    device.isBlocked = blocked;
    device.lastModified = new Date().toISOString();

    try {
      if (blocked) {
        // Block device using iptables
        await execAsync(`sudo iptables -A INPUT -s ${device.ipAddress} -j DROP`);
        await execAsync(`sudo iptables -A FORWARD -s ${device.ipAddress} -j DROP`);
        logger.info(`Device blocked: ${device.name} (${device.ipAddress})`);
      } else {
        // Unblock device
        await execAsync(`sudo iptables -D INPUT -s ${device.ipAddress} -j DROP`);
        await execAsync(`sudo iptables -D FORWARD -s ${device.ipAddress} -j DROP`);
        logger.info(`Device unblocked: ${device.name} (${device.ipAddress})`);
      }
    } catch (error) {
      logger.error(`Error ${blocked ? 'blocking' : 'unblocking'} device:`, error);
    }

    this.devices.set(deviceId, device);
    await this.saveDevices();
    
    this.io.emit('device-blocked', { deviceId, blocked });
    
    return device;
  }

  async getDeviceTraffic(deviceId, period = '24h') {
    const device = this.devices.get(deviceId);
    if (!device) {
      return null;
    }

    try {
      // Get traffic statistics from iptables or netstat
      const { stdout } = await execAsync(`sudo iptables -L -v -n | grep ${device.ipAddress}`);
      
      // Parse traffic data (simplified)
      const trafficData = this.parseTrafficOutput(stdout);
      
      return {
        deviceId,
        period,
        ...trafficData,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error getting traffic for device ${deviceId}:`, error);
      return {
        deviceId,
        period,
        bytesReceived: 0,
        bytesSent: 0,
        packetsReceived: 0,
        packetsSent: 0,
        lastUpdated: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async scanForDevices() {
    try {
      logger.info('Starting network scan for devices...');
      
      // Get current network devices using nmap or arp-scan
      const { stdout } = await execAsync('sudo arp-scan -l');
      const devices = this.parseArpScanOutput(stdout);
      
      const newDevices = [];
      
      for (const deviceInfo of devices) {
        // Check if device already exists
        const existingDevice = Array.from(this.devices.values())
          .find(d => d.macAddress === deviceInfo.macAddress);
        
        if (!existingDevice) {
          const device = await this.addDevice({
            name: deviceInfo.name || 'Unknown Device',
            macAddress: deviceInfo.macAddress,
            ipAddress: deviceInfo.ipAddress,
            deviceType: this.detectDeviceType(deviceInfo.macAddress),
            manufacturer: deviceInfo.manufacturer || 'Unknown'
          });
          newDevices.push(device);
        } else {
          // Update last seen time
          existingDevice.lastSeen = new Date().toISOString();
          this.devices.set(existingDevice.id, existingDevice);
        }
      }
      
      await this.saveDevices();
      
      logger.info(`Network scan completed. Found ${newDevices.length} new devices.`);
      this.io.emit('devices-scanned', { newDevices, totalFound: devices.length });
      
      return newDevices;
    } catch (error) {
      logger.error('Error scanning for devices:', error);
      throw error;
    }
  }

  async pingDevice(ipAddress) {
    try {
      const { stdout } = await execAsync(`ping -c 1 -W 1 ${ipAddress}`);
      return stdout.includes('1 received');
    } catch (error) {
      return false;
    }
  }

  parseArpScanOutput(output) {
    const lines = output.split('\n');
    const devices = [];
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3 && parts[0].match(/^\d+\.\d+\.\d+\.\d+$/)) {
        devices.push({
          ipAddress: parts[0],
          macAddress: parts[1],
          manufacturer: parts.slice(2).join(' ')
        });
      }
    }
    
    return devices;
  }

  parseTrafficOutput(output) {
    // Simplified traffic parsing - in a real implementation,
    // you'd parse iptables output more thoroughly
    const lines = output.split('\n');
    let bytesReceived = 0;
    let bytesSent = 0;
    let packetsReceived = 0;
    let packetsSent = 0;
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const bytes = parseInt(parts[1]) || 0;
        const packets = parseInt(parts[0]) || 0;
        
        if (line.includes('INPUT')) {
          bytesReceived += bytes;
          packetsReceived += packets;
        } else if (line.includes('OUTPUT')) {
          bytesSent += bytes;
          packetsSent += packets;
        }
      }
    }
    
    return {
      bytesReceived,
      bytesSent,
      packetsReceived,
      packetsSent
    };
  }

  detectDeviceType(macAddress) {
    // Simple device type detection based on MAC address OUI
    const oui = macAddress.substring(0, 8).toUpperCase();
    
    const deviceTypes = {
      '00:50:56': 'VMware',
      '08:00:27': 'VirtualBox',
      '52:54:00': 'QEMU',
      'AC:DE:48': 'Raspberry Pi',
      'B8:27:EB': 'Raspberry Pi',
      'DC:A6:32': 'Raspberry Pi',
      'E4:5F:01': 'Raspberry Pi'
    };
    
    return deviceTypes[oui] || 'Unknown';
  }

  generateDeviceId() {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = DeviceManager;