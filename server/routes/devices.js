const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Get all devices
router.get('/', async (req, res) => {
  try {
    const deviceManager = req.app.get('deviceManager');
    const devices = await deviceManager.getAllDevices();
    res.json(devices);
  } catch (error) {
    logger.error('Error getting devices:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// Get device by ID
router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const deviceManager = req.app.get('deviceManager');
    const device = await deviceManager.getDevice(deviceId);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json(device);
  } catch (error) {
    logger.error('Error getting device:', error);
    res.status(500).json({ error: 'Failed to get device' });
  }
});

// Add new device
router.post('/', async (req, res) => {
  try {
    const deviceData = req.body;
    const deviceManager = req.app.get('deviceManager');
    const device = await deviceManager.addDevice(deviceData);
    res.status(201).json(device);
  } catch (error) {
    logger.error('Error adding device:', error);
    res.status(500).json({ error: 'Failed to add device' });
  }
});

// Update device
router.put('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const updateData = req.body;
    const deviceManager = req.app.get('deviceManager');
    const device = await deviceManager.updateDevice(deviceId, updateData);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json(device);
  } catch (error) {
    logger.error('Error updating device:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Delete device
router.delete('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const deviceManager = req.app.get('deviceManager');
    const result = await deviceManager.deleteDevice(deviceId);
    
    if (!result) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    logger.error('Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// Get device status
router.get('/:deviceId/status', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const deviceManager = req.app.get('deviceManager');
    const status = await deviceManager.getDeviceStatus(deviceId);
    
    if (!status) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json(status);
  } catch (error) {
    logger.error('Error getting device status:', error);
    res.status(500).json({ error: 'Failed to get device status' });
  }
});

// Block/Unblock device
router.post('/:deviceId/block', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { blocked } = req.body;
    const deviceManager = req.app.get('deviceManager');
    const result = await deviceManager.blockDevice(deviceId, blocked);
    
    if (!result) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error blocking/unblocking device:', error);
    res.status(500).json({ error: 'Failed to update device block status' });
  }
});

// Get device traffic statistics
router.get('/:deviceId/traffic', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { period = '24h' } = req.query;
    const deviceManager = req.app.get('deviceManager');
    const traffic = await deviceManager.getDeviceTraffic(deviceId, period);
    
    if (!traffic) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json(traffic);
  } catch (error) {
    logger.error('Error getting device traffic:', error);
    res.status(500).json({ error: 'Failed to get device traffic' });
  }
});

// Scan for new devices
router.post('/scan', async (req, res) => {
  try {
    const deviceManager = req.app.get('deviceManager');
    const newDevices = await deviceManager.scanForDevices();
    res.json({ newDevices, count: newDevices.length });
  } catch (error) {
    logger.error('Error scanning for devices:', error);
    res.status(500).json({ error: 'Failed to scan for devices' });
  }
});

module.exports = router;