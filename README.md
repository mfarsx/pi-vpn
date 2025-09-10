# Pi VPN - Home WiFi VPN Solution

A comprehensive VPN solution for Raspberry Pi that provides secure remote access to your home network. Built with Node.js and featuring a modern web interface for easy management.

## Features

- 🔒 **WireGuard VPN Server** - Modern, fast, and secure VPN protocol
- 🌐 **Web Management Interface** - Easy-to-use dashboard for configuration
- 📱 **Mobile Support** - QR code generation for easy mobile setup
- 🔍 **Device Discovery** - Automatic network device scanning and management
- 📊 **Real-time Monitoring** - Live traffic statistics and connection monitoring
- 🛡️ **Security Features** - Firewall integration, access control, and intrusion detection
- 🔧 **Easy Configuration** - JSON-based configuration with web interface
- 📈 **Performance Monitoring** - System resource monitoring and alerts

## Quick Start

### Prerequisites

- Raspberry Pi (3B+ or newer recommended)
- Raspberry Pi OS (Bullseye or newer)
- Node.js 16+ and npm
- WireGuard tools
- Root/sudo access

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/pi-vpn.git
   cd pi-vpn
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure your environment:**
   Edit `.env` file with your settings:
   ```bash
   nano .env
   ```

5. **Run the setup script:**
   ```bash
   npm run setup
   ```

6. **Start the VPN server:**
   ```bash
   npm start
   ```

7. **Access the web interface:**
   Open your browser and go to `http://your-pi-ip:3000`

## Project Structure

```
pi-vpn/
├── server/                 # Backend server
│   ├── index.js           # Main server entry point
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication endpoints
│   │   ├── vpn.js         # VPN management endpoints
│   │   ├── devices.js     # Device management endpoints
│   │   └── config.js      # Configuration endpoints
│   ├── services/          # Business logic services
│   │   ├── VPNManager.js  # VPN service management
│   │   └── DeviceManager.js # Device management
│   ├── middleware/         # Express middleware
│   │   ├── auth.js        # Authentication middleware
│   │   └── errorHandler.js # Error handling
│   └── utils/              # Utility functions
│       └── logger.js       # Logging configuration
├── client/                 # Frontend client
│   ├── index.js           # Client server
│   └── public/             # Static web files
│       ├── index.html      # Main HTML page
│       ├── styles.css      # CSS styles
│       └── app.js          # Frontend JavaScript
├── config/                 # Configuration files
│   ├── vpn.json           # VPN configuration
│   ├── system.json        # System configuration
│   ├── network.json       # Network configuration
│   ├── security.json      # Security configuration
│   └── defaults/          # Default configurations
├── scripts/                # Management scripts
│   ├── setup.js           # Initial setup script
│   ├── deploy.js          # Deployment script
│   └── backup.js          # Backup script
├── data/                   # Data storage
│   └── devices.json       # Device database
├── logs/                   # Log files
├── package.json           # Node.js dependencies
├── .env.example          # Environment variables template
└── README.md             # This file
```

## Configuration

### VPN Configuration

The VPN is configured through the web interface or by editing `config/vpn.json`:

```json
{
  "serverName": "Pi VPN Server",
  "port": 51820,
  "serverIP": "192.168.1.100",
  "dns": "8.8.8.8, 1.1.1.1",
  "allowedIPs": "0.0.0.0/0",
  "maxClients": 50
}
```

### Security Configuration

Security settings in `config/security.json`:

```json
{
  "encryption": {
    "algorithm": "ChaCha20Poly1305",
    "keySize": 256
  },
  "firewall": {
    "enabled": true,
    "defaultPolicy": "DROP"
  }
}
```

## Usage

### Web Interface

1. **Login:** Default credentials are `admin` / `password` (change immediately!)
2. **Dashboard:** View VPN status, connected clients, and network statistics
3. **Devices:** Manage network devices, block/unblock access
4. **Clients:** Generate VPN client configurations
5. **Settings:** Configure VPN, network, and security settings

### Adding VPN Clients

1. Go to the "VPN Clients" section
2. Click "Add Client"
3. Enter client name and type (mobile/desktop/server)
4. Download the configuration file or scan QR code for mobile

### Mobile Setup

1. Install WireGuard app from App Store/Google Play
2. Generate client configuration in web interface
3. Scan QR code with WireGuard app
4. Connect to VPN

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify token

### VPN Management
- `GET /api/vpn/status` - Get VPN status
- `POST /api/vpn/start` - Start VPN service
- `POST /api/vpn/stop` - Stop VPN service
- `GET /api/vpn/clients` - Get connected clients
- `POST /api/vpn/clients/generate` - Generate client config

### Device Management
- `GET /api/devices` - Get all devices
- `POST /api/devices/scan` - Scan for new devices
- `POST /api/devices/:id/block` - Block/unblock device

## Security Considerations

- Change default passwords immediately
- Use strong JWT secrets in production
- Enable firewall and fail2ban
- Keep system updated
- Use HTTPS in production
- Regular security audits

## Troubleshooting

### Common Issues

1. **VPN won't start:**
   - Check WireGuard installation: `sudo apt install wireguard`
   - Verify configuration: `sudo wg-quick up wg0`
   - Check logs: `journalctl -u wireguard`

2. **Web interface not accessible:**
   - Check if server is running: `npm start`
   - Verify port 3000 is open
   - Check firewall settings

3. **Client can't connect:**
   - Verify client configuration
   - Check server IP and port
   - Ensure firewall allows VPN traffic

### Logs

- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- System logs: `journalctl -u wireguard`

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Testing

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/pi-vpn/issues)
- 💬 [Discussions](https://github.com/yourusername/pi-vpn/discussions)

## Acknowledgments

- WireGuard project for the excellent VPN protocol
- Raspberry Pi Foundation for the amazing hardware
- Node.js community for the robust platform