const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../server/utils/logger');

const app = express();
const PORT = process.env.CLIENT_PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes for client configuration
app.get('/api/config/:clientName', async (req, res) => {
  try {
    const { clientName } = req.params;
    const configPath = path.join(__dirname, '../config/clients', `${clientName}.conf`);
    
    const config = await fs.readFile(configPath, 'utf8');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${clientName}.conf"`);
    res.send(config);
  } catch (error) {
    logger.error('Error serving client config:', error);
    res.status(404).json({ error: 'Client configuration not found' });
  }
});

// QR code for mobile setup
app.get('/api/qr/:clientName', async (req, res) => {
  try {
    const { clientName } = req.params;
    const configPath = path.join(__dirname, '../config/clients', `${clientName}.conf`);
    
    const config = await fs.readFile(configPath, 'utf8');
    const QRCode = require('qrcode');
    
    const qrCode = await QRCode.toDataURL(config);
    res.json({ qrCode });
  } catch (error) {
    logger.error('Error generating QR code:', error);
    res.status(404).json({ error: 'Client configuration not found' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  logger.info(`Pi VPN Client running on port ${PORT}`);
});

module.exports = app;