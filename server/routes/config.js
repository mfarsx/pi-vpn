const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

// Get system configuration
router.get('/system', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '../../config/system.json');
    const config = await fs.readFile(configPath, 'utf8');
    res.json(JSON.parse(config));
  } catch (error) {
    logger.error('Error getting system config:', error);
    res.status(500).json({ error: 'Failed to get system configuration' });
  }
});

// Update system configuration
router.put('/system', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '../../config/system.json');
    await fs.writeFile(configPath, JSON.stringify(req.body, null, 2));
    logger.info('System configuration updated');
    res.json({ message: 'System configuration updated successfully' });
  } catch (error) {
    logger.error('Error updating system config:', error);
    res.status(500).json({ error: 'Failed to update system configuration' });
  }
});

// Get network configuration
router.get('/network', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '../../config/network.json');
    const config = await fs.readFile(configPath, 'utf8');
    res.json(JSON.parse(config));
  } catch (error) {
    logger.error('Error getting network config:', error);
    res.status(500).json({ error: 'Failed to get network configuration' });
  }
});

// Update network configuration
router.put('/network', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '../../config/network.json');
    await fs.writeFile(configPath, JSON.stringify(req.body, null, 2));
    logger.info('Network configuration updated');
    res.json({ message: 'Network configuration updated successfully' });
  } catch (error) {
    logger.error('Error updating network config:', error);
    res.status(500).json({ error: 'Failed to update network configuration' });
  }
});

// Get VPN configuration
router.get('/vpn', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '../../config/vpn.json');
    const config = await fs.readFile(configPath, 'utf8');
    res.json(JSON.parse(config));
  } catch (error) {
    logger.error('Error getting VPN config:', error);
    res.status(500).json({ error: 'Failed to get VPN configuration' });
  }
});

// Update VPN configuration
router.put('/vpn', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '../../config/vpn.json');
    await fs.writeFile(configPath, JSON.stringify(req.body, null, 2));
    logger.info('VPN configuration updated');
    res.json({ message: 'VPN configuration updated successfully' });
  } catch (error) {
    logger.error('Error updating VPN config:', error);
    res.status(500).json({ error: 'Failed to update VPN configuration' });
  }
});

// Get security configuration
router.get('/security', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '../../config/security.json');
    const config = await fs.readFile(configPath, 'utf8');
    res.json(JSON.parse(config));
  } catch (error) {
    logger.error('Error getting security config:', error);
    res.status(500).json({ error: 'Failed to get security configuration' });
  }
});

// Update security configuration
router.put('/security', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '../../config/security.json');
    await fs.writeFile(configPath, JSON.stringify(req.body, null, 2));
    logger.info('Security configuration updated');
    res.json({ message: 'Security configuration updated successfully' });
  } catch (error) {
    logger.error('Error updating security config:', error);
    res.status(500).json({ error: 'Failed to update security configuration' });
  }
});

// Export configuration
router.get('/export', async (req, res) => {
  try {
    const configDir = path.join(__dirname, '../../config');
    const configs = {};
    
    const files = await fs.readdir(configDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const configPath = path.join(configDir, file);
        const config = await fs.readFile(configPath, 'utf8');
        configs[file.replace('.json', '')] = JSON.parse(config);
      }
    }
    
    res.json(configs);
  } catch (error) {
    logger.error('Error exporting config:', error);
    res.status(500).json({ error: 'Failed to export configuration' });
  }
});

// Import configuration
router.post('/import', async (req, res) => {
  try {
    const configs = req.body;
    const configDir = path.join(__dirname, '../../config');
    
    for (const [configName, configData] of Object.entries(configs)) {
      const configPath = path.join(configDir, `${configName}.json`);
      await fs.writeFile(configPath, JSON.stringify(configData, null, 2));
    }
    
    logger.info('Configuration imported successfully');
    res.json({ message: 'Configuration imported successfully' });
  } catch (error) {
    logger.error('Error importing config:', error);
    res.status(500).json({ error: 'Failed to import configuration' });
  }
});

// Reset to default configuration
router.post('/reset', async (req, res) => {
  try {
    const { configType } = req.body;
    const configDir = path.join(__dirname, '../../config');
    const defaultsDir = path.join(__dirname, '../../config/defaults');
    
    if (configType) {
      // Reset specific configuration
      const defaultPath = path.join(defaultsDir, `${configType}.json`);
      const configPath = path.join(configDir, `${configType}.json`);
      
      const defaultConfig = await fs.readFile(defaultPath, 'utf8');
      await fs.writeFile(configPath, defaultConfig);
    } else {
      // Reset all configurations
      const defaultFiles = await fs.readdir(defaultsDir);
      for (const file of defaultFiles) {
        if (file.endsWith('.json')) {
          const defaultPath = path.join(defaultsDir, file);
          const configPath = path.join(configDir, file);
          
          const defaultConfig = await fs.readFile(defaultPath, 'utf8');
          await fs.writeFile(configPath, defaultConfig);
        }
      }
    }
    
    logger.info(`Configuration reset: ${configType || 'all'}`);
    res.json({ message: 'Configuration reset successfully' });
  } catch (error) {
    logger.error('Error resetting config:', error);
    res.status(500).json({ error: 'Failed to reset configuration' });
  }
});

module.exports = router;