const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Get VPN status
router.get('/status', async (req, res) => {
  try {
    const vpnManager = req.app.get('vpnManager');
    const status = await vpnManager.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting VPN status:', error);
    res.status(500).json({ error: 'Failed to get VPN status' });
  }
});

// Start VPN service
router.post('/start', async (req, res) => {
  try {
    const vpnManager = req.app.get('vpnManager');
    const result = await vpnManager.start();
    res.json(result);
  } catch (error) {
    logger.error('Error starting VPN:', error);
    res.status(500).json({ error: 'Failed to start VPN service' });
  }
});

// Stop VPN service
router.post('/stop', async (req, res) => {
  try {
    const vpnManager = req.app.get('vpnManager');
    const result = await vpnManager.stop();
    res.json(result);
  } catch (error) {
    logger.error('Error stopping VPN:', error);
    res.status(500).json({ error: 'Failed to stop VPN service' });
  }
});

// Restart VPN service
router.post('/restart', async (req, res) => {
  try {
    const vpnManager = req.app.get('vpnManager');
    const result = await vpnManager.restart();
    res.json(result);
  } catch (error) {
    logger.error('Error restarting VPN:', error);
    res.status(500).json({ error: 'Failed to restart VPN service' });
  }
});

// Get VPN configuration
router.get('/config', async (req, res) => {
  try {
    const vpnManager = req.app.get('vpnManager');
    const config = await vpnManager.getConfig();
    res.json(config);
  } catch (error) {
    logger.error('Error getting VPN config:', error);
    res.status(500).json({ error: 'Failed to get VPN configuration' });
  }
});

// Update VPN configuration
router.put('/config', async (req, res) => {
  try {
    const vpnManager = req.app.get('vpnManager');
    const result = await vpnManager.updateConfig(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error updating VPN config:', error);
    res.status(500).json({ error: 'Failed to update VPN configuration' });
  }
});

// Get connected clients
router.get('/clients', async (req, res) => {
  try {
    const vpnManager = req.app.get('vpnManager');
    const clients = await vpnManager.getConnectedClients();
    res.json(clients);
  } catch (error) {
    logger.error('Error getting connected clients:', error);
    res.status(500).json({ error: 'Failed to get connected clients' });
  }
});

// Generate client configuration
router.post('/clients/generate', async (req, res) => {
  try {
    const { clientName, clientType } = req.body;
    const vpnManager = req.app.get('vpnManager');
    const config = await vpnManager.generateClientConfig(clientName, clientType);
    res.json(config);
  } catch (error) {
    logger.error('Error generating client config:', error);
    res.status(500).json({ error: 'Failed to generate client configuration' });
  }
});

// Revoke client access
router.delete('/clients/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const vpnManager = req.app.get('vpnManager');
    const result = await vpnManager.revokeClient(clientId);
    res.json(result);
  } catch (error) {
    logger.error('Error revoking client:', error);
    res.status(500).json({ error: 'Failed to revoke client access' });
  }
});

// Get VPN logs
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100, level } = req.query;
    const vpnManager = req.app.get('vpnManager');
    const logs = await vpnManager.getLogs(parseInt(limit), level);
    res.json(logs);
  } catch (error) {
    logger.error('Error getting VPN logs:', error);
    res.status(500).json({ error: 'Failed to get VPN logs' });
  }
});

// Get VPN statistics
router.get('/stats', async (req, res) => {
  try {
    const vpnManager = req.app.get('vpnManager');
    const stats = await vpnManager.getStatistics();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting VPN stats:', error);
    res.status(500).json({ error: 'Failed to get VPN statistics' });
  }
});

module.exports = router;