const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const QRCode = require('qrcode');

const execAsync = promisify(exec);

class VPNManager {
  constructor(io) {
    this.io = io;
    this.configPath = path.join(__dirname, '../../config/vpn.json');
    this.clientConfigsPath = path.join(__dirname, '../../config/clients');
    this.isRunning = false;
    this.connectedClients = new Map();
  }

  async getStatus() {
    try {
      // Check if VPN service is running
      const { stdout } = await execAsync('systemctl is-active wireguard');
      this.isRunning = stdout.trim() === 'active';
      
      return {
        isRunning: this.isRunning,
        connectedClients: Array.from(this.connectedClients.values()),
        uptime: this.isRunning ? await this.getUptime() : 0,
        lastStarted: this.isRunning ? await this.getLastStarted() : null
      };
    } catch (error) {
      logger.error('Error getting VPN status:', error);
      return {
        isRunning: false,
        connectedClients: [],
        uptime: 0,
        lastStarted: null,
        error: error.message
      };
    }
  }

  async start() {
    try {
      await execAsync('sudo systemctl start wireguard');
      this.isRunning = true;
      
      logger.info('VPN service started');
      this.io.emit('vpn-status-changed', { isRunning: true });
      
      return { success: true, message: 'VPN service started successfully' };
    } catch (error) {
      logger.error('Error starting VPN:', error);
      return { success: false, error: error.message };
    }
  }

  async stop() {
    try {
      await execAsync('sudo systemctl stop wireguard');
      this.isRunning = false;
      this.connectedClients.clear();
      
      logger.info('VPN service stopped');
      this.io.emit('vpn-status-changed', { isRunning: false });
      
      return { success: true, message: 'VPN service stopped successfully' };
    } catch (error) {
      logger.error('Error stopping VPN:', error);
      return { success: false, error: error.message };
    }
  }

  async restart() {
    try {
      await execAsync('sudo systemctl restart wireguard');
      this.isRunning = true;
      
      logger.info('VPN service restarted');
      this.io.emit('vpn-status-changed', { isRunning: true });
      
      return { success: true, message: 'VPN service restarted successfully' };
    } catch (error) {
      logger.error('Error restarting VPN:', error);
      return { success: false, error: error.message };
    }
  }

  async getConfig() {
    try {
      const config = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(config);
    } catch (error) {
      logger.error('Error reading VPN config:', error);
      throw error;
    }
  }

  async updateConfig(newConfig) {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(newConfig, null, 2));
      
      // Reload WireGuard configuration
      await execAsync('sudo wg-quick down wg0 || true');
      await execAsync('sudo wg-quick up wg0');
      
      logger.info('VPN configuration updated');
      this.io.emit('vpn-config-changed', newConfig);
      
      return { success: true, message: 'VPN configuration updated successfully' };
    } catch (error) {
      logger.error('Error updating VPN config:', error);
      return { success: false, error: error.message };
    }
  }

  async getConnectedClients() {
    try {
      const { stdout } = await execAsync('sudo wg show wg0');
      const clients = this.parseWireGuardOutput(stdout);
      this.connectedClients = new Map(clients.map(client => [client.publicKey, client]));
      
      return clients;
    } catch (error) {
      logger.error('Error getting connected clients:', error);
      return [];
    }
  }

  async generateClientConfig(clientName, clientType = 'mobile') {
    try {
      // Generate private key
      const { stdout: privateKey } = await execAsync('wg genkey');
      
      // Generate public key
      const { stdout: publicKey } = await execAsync(`echo "${privateKey.trim()}" | wg pubkey`);
      
      // Generate preshared key
      const { stdout: presharedKey } = await execAsync('wg genpsk');
      
      // Get server config
      const serverConfig = await this.getConfig();
      
      // Create client configuration
      const clientConfig = {
        clientName,
        clientType,
        privateKey: privateKey.trim(),
        publicKey: publicKey.trim(),
        presharedKey: presharedKey.trim(),
        allowedIPs: clientType === 'mobile' ? '0.0.0.0/0' : '10.0.0.0/24',
        createdAt: new Date().toISOString()
      };
      
      // Save client config
      const clientConfigPath = path.join(this.clientConfigsPath, `${clientName}.json`);
      await fs.writeFile(clientConfigPath, JSON.stringify(clientConfig, null, 2));
      
      // Generate WireGuard config file
      const wgConfig = this.generateWireGuardConfig(clientConfig, serverConfig);
      const wgConfigPath = path.join(this.clientConfigsPath, `${clientName}.conf`);
      await fs.writeFile(wgConfigPath, wgConfig);
      
      // Generate QR code
      const qrCode = await QRCode.toDataURL(wgConfig);
      
      logger.info(`Client configuration generated for ${clientName}`);
      
      return {
        clientConfig,
        wgConfig,
        qrCode,
        downloadUrl: `/api/vpn/clients/${clientName}/download`
      };
    } catch (error) {
      logger.error('Error generating client config:', error);
      throw error;
    }
  }

  async revokeClient(clientId) {
    try {
      const clientConfigPath = path.join(this.clientConfigsPath, `${clientId}.json`);
      const wgConfigPath = path.join(this.clientConfigsPath, `${clientId}.conf`);
      
      // Remove client files
      await fs.unlink(clientConfigPath).catch(() => {});
      await fs.unlink(wgConfigPath).catch(() => {});
      
      // Remove from WireGuard interface
      await execAsync(`sudo wg set wg0 peer ${clientId} remove`).catch(() => {});
      
      logger.info(`Client access revoked: ${clientId}`);
      
      return { success: true, message: 'Client access revoked successfully' };
    } catch (error) {
      logger.error('Error revoking client:', error);
      return { success: false, error: error.message };
    }
  }

  async getLogs(limit = 100, level = 'all') {
    try {
      const { stdout } = await execAsync(`journalctl -u wireguard -n ${limit} --no-pager`);
      return stdout.split('\n').filter(line => line.trim()).map(line => ({
        timestamp: line.split(' ')[0] + ' ' + line.split(' ')[1],
        message: line.substring(line.indexOf(']') + 1).trim(),
        level: 'info'
      }));
    } catch (error) {
      logger.error('Error getting VPN logs:', error);
      return [];
    }
  }

  async getStatistics() {
    try {
      const { stdout } = await execAsync('sudo wg show wg0');
      const stats = this.parseWireGuardStats(stdout);
      
      return {
        totalClients: stats.length,
        activeClients: stats.filter(client => client.latestHandshake).length,
        totalBytesReceived: stats.reduce((sum, client) => sum + (client.receiveBytes || 0), 0),
        totalBytesSent: stats.reduce((sum, client) => sum + (client.transmitBytes || 0), 0),
        clients: stats
      };
    } catch (error) {
      logger.error('Error getting VPN statistics:', error);
      return {
        totalClients: 0,
        activeClients: 0,
        totalBytesReceived: 0,
        totalBytesSent: 0,
        clients: []
      };
    }
  }

  generateWireGuardConfig(clientConfig, serverConfig) {
    return `[Interface]
PrivateKey = ${clientConfig.privateKey}
Address = ${clientConfig.allowedIPs.includes('0.0.0.0') ? '10.0.0.2/24' : '10.0.0.2/24'}
DNS = ${serverConfig.dns || '8.8.8.8'}

[Peer]
PublicKey = ${serverConfig.publicKey}
PresharedKey = ${clientConfig.presharedKey}
Endpoint = ${serverConfig.endpoint}:${serverConfig.port}
AllowedIPs = ${clientConfig.allowedIPs}
PersistentKeepalive = 25`;
  }

  parseWireGuardOutput(output) {
    const lines = output.split('\n');
    const clients = [];
    let currentClient = null;
    
    for (const line of lines) {
      if (line.startsWith('peer:')) {
        if (currentClient) {
          clients.push(currentClient);
        }
        currentClient = {
          publicKey: line.split(':')[1].trim(),
          latestHandshake: null,
          receiveBytes: 0,
          transmitBytes: 0
        };
      } else if (line.includes('latest handshake:')) {
        if (currentClient) {
          currentClient.latestHandshake = line.split(':')[1].trim();
        }
      } else if (line.includes('transfer:')) {
        const transferMatch = line.match(/(\d+\.?\d* [KMGT]?B) received, (\d+\.?\d* [KMGT]?B) sent/);
        if (transferMatch && currentClient) {
          currentClient.receiveBytes = this.parseBytes(transferMatch[1]);
          currentClient.transmitBytes = this.parseBytes(transferMatch[2]);
        }
      }
    }
    
    if (currentClient) {
      clients.push(currentClient);
    }
    
    return clients;
  }

  parseWireGuardStats(output) {
    return this.parseWireGuardOutput(output);
  }

  parseBytes(bytesStr) {
    const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024, TB: 1024 * 1024 * 1024 * 1024 };
    const match = bytesStr.match(/(\d+\.?\d*)\s*([KMGT]?B)/);
    if (match) {
      return parseFloat(match[1]) * units[match[2]];
    }
    return 0;
  }

  async getUptime() {
    try {
      const { stdout } = await execAsync('systemctl show wireguard --property=ActiveEnterTimestamp --value');
      const startTime = new Date(stdout.trim());
      return Date.now() - startTime.getTime();
    } catch (error) {
      return 0;
    }
  }

  async getLastStarted() {
    try {
      const { stdout } = await execAsync('systemctl show wireguard --property=ActiveEnterTimestamp --value');
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }
}

module.exports = VPNManager;