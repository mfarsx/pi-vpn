# Pi VPN - Home WiFi VPN Solution

A comprehensive VPN solution for Raspberry Pi that provides secure remote access to your home network. Built with Node.js and featuring a modern web interface for easy management.

## 🚀 Quick Start

### Prerequisites
- Raspberry Pi (3B+ or newer recommended)
- Raspberry Pi OS (Bullseye or newer)
- Node.js 16+ and npm
- WireGuard tools
- Root/sudo access

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mfarsx/pi-vpn.git
   cd pi-vpn
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run setup:**
   ```bash
   npm run setup
   ```

5. **Start the VPN server:**
   ```bash
   npm start
   ```

6. **Access the web interface:**
   Open your browser and go to `http://your-pi-ip:3000`

## 🎯 Features

- 🔒 **WireGuard VPN Server** - Modern, fast, and secure VPN protocol
- 🌐 **Web Management Interface** - Easy-to-use dashboard for configuration
- 📱 **Mobile Support** - QR code generation for easy mobile setup
- 🔍 **Device Discovery** - Automatic network device scanning and management
- 📊 **Real-time Monitoring** - Live traffic statistics and connection monitoring
- 🛡️ **Security Features** - Firewall integration, access control, and intrusion detection
- 🔧 **Easy Configuration** - JSON-based configuration with web interface
- 📈 **Performance Monitoring** - System resource monitoring and alerts

## 🐳 Docker Deployment

### Production Deployment
```bash
# Use production environment
cp .env.production .env

# Start with Docker Compose
docker-compose up -d
```

### Custom Port Configuration
```bash
# Change ports by setting environment variables
PORT=8080 VPN_PORT=1194 docker-compose up -d
```

### Environment Variables
- `PORT` - Web interface port (default: 3000)
- `VPN_PORT` - WireGuard VPN port (default: 51820)
- `CLIENT_URL` - Web interface URL
- `JWT_SECRET` - JWT secret key
- `VPN_INTERFACE` - WireGuard interface name
- `VPN_NETWORK` - VPN network range
- `VPN_SERVER_IP` - VPN server IP address

## 🌐 Hosting Platform Deployment

This project is ready for deployment on Raspberry Pi hosting platforms:

### Deployment Configuration
- **Repository**: `https://github.com/mfarsx/pi-vpn.git`
- **Domain**: `pi-vpn.mfarsx.dev`
- **Port**: `3000` (configurable via environment variables)
- **Dockerfile**: `Dockerfile`
- **Environment**: `.env.production`

### Environment Variables for Hosting Platform
```json
{
  "NODE_ENV": "production",
  "PORT": "3000",
  "CLIENT_URL": "https://pi-vpn.mfarsx.dev",
  "VPN_PORT": "51820",
  "JWT_SECRET": "pi-vpn-jwt-secret-key-2024-production-mfarsx-dev-secure",
  "VPN_INTERFACE": "wg0",
  "VPN_NETWORK": "10.0.0.0/24",
  "VPN_SERVER_IP": "10.0.0.1",
  "ENABLE_HTTPS": "true",
  "LOG_LEVEL": "info",
  "MONITORING_ENABLED": "true",
  "EXTERNAL_DNS": "8.8.8.8,1.1.1.1",
  "EXTERNAL_NTP": "pool.ntp.org"
}
```

### Required Setup
1. **DNS**: Point `pi-vpn.mfarsx.dev` to your Raspberry Pi's IP
2. **Router**: Forward port `51820` (UDP) to your Raspberry Pi
3. **Hosting Platform**: Deploy with port `3000`

## 📱 Client Setup

### Mobile Clients
1. **Generate client config** in web interface
2. **Scan QR code** with WireGuard app
3. **Connect to VPN**

### Desktop Clients
1. **Download config file** from web interface
2. **Import into WireGuard** client
3. **Connect to VPN**

## 🔧 Configuration

### VPN Configuration
Edit `config/vpn.json`:
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
Edit `config/security.json`:
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

## 🛠️ Development

### Local Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Docker Development
```bash
# Build Docker image
docker build -t pi-vpn:latest .

# Run container
docker run -p 3000:3000 -p 51820:51820/udp pi-vpn:latest
```

## 📊 API Endpoints

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

## 🔒 Security Considerations

- Change default passwords immediately
- Use strong JWT secrets in production
- Enable firewall and fail2ban
- Keep system updated
- Use HTTPS in production
- Regular security audits

## 🚨 Troubleshooting

### Common Issues

1. **VPN won't start:**
   ```bash
   # Check WireGuard installation
   sudo apt install wireguard
   
   # Verify configuration
   sudo wg-quick up wg0
   
   # Check logs
   journalctl -u wireguard
   ```

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- WireGuard project for the excellent VPN protocol
- Raspberry Pi Foundation for the amazing hardware
- Node.js community for the robust platform

---

**🎯 Your Pi VPN will be accessible at**: `https://pi-vpn.mfarsx.dev`
**🔗 VPN Server**: `mfarsx.dev:51820`