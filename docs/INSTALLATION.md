# Installation Guide

This guide will walk you through installing and setting up Pi VPN on your Raspberry Pi.

## System Requirements

### Hardware Requirements
- Raspberry Pi 3B+ or newer (4B recommended)
- MicroSD card (32GB+ recommended, Class 10 or better)
- Ethernet cable for initial setup
- Power supply (5V/3A recommended for Pi 4)

### Software Requirements
- Raspberry Pi OS (Bullseye or newer)
- Node.js 16+ and npm
- WireGuard tools
- Root/sudo access

## Step 1: Prepare Raspberry Pi OS

### 1.1 Flash Raspberry Pi OS
1. Download [Raspberry Pi Imager](https://www.raspberrypi.org/downloads/)
2. Flash Raspberry Pi OS Lite (64-bit recommended) to your SD card
3. Enable SSH and set WiFi credentials if needed
4. Boot your Raspberry Pi

### 1.2 Initial Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git vim htop

# Set timezone
sudo timedatectl set-timezone America/New_York

# Configure hostname
sudo hostnamectl set-hostname pi-vpn-server
```

## Step 2: Install Node.js

### 2.1 Install Node.js 18 (LTS)
```bash
# Download and install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 3: Install WireGuard

### 3.1 Install WireGuard
```bash
# Install WireGuard
sudo apt install -y wireguard wireguard-tools

# Enable IP forwarding
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Enable WireGuard service
sudo systemctl enable wg-quick@wg0
```

### 3.2 Configure Firewall
```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install -y ufw

# Configure firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 51820/udp  # WireGuard port
sudo ufw allow 3000/tcp   # Web interface
sudo ufw allow 3001/tcp   # API server
sudo ufw --force enable
```

## Step 4: Install Pi VPN

### 4.1 Clone Repository
```bash
# Clone the repository
git clone https://github.com/yourusername/pi-vpn.git
cd pi-vpn

# Install dependencies
npm install
```

### 4.2 Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Update the following variables:
```env
NODE_ENV=production
PORT=3001
CLIENT_PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
VPN_INTERFACE=wg0
VPN_PORT=51820
VPN_SERVER_IP=192.168.1.100  # Your Pi's IP address
```

### 4.3 Run Setup Script
```bash
# Run the setup script
npm run setup
```

This script will:
- Generate WireGuard keys
- Create necessary directories
- Set up systemd services
- Configure initial settings

## Step 5: Configure System Services

### 5.1 Create Systemd Service
```bash
# Create service file
sudo nano /etc/systemd/system/pi-vpn.service
```

Add the following content:
```ini
[Unit]
Description=Pi VPN Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/pi-vpn
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 5.2 Enable and Start Services
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable pi-vpn
sudo systemctl enable wireguard

# Start services
sudo systemctl start pi-vpn
sudo systemctl start wireguard

# Check status
sudo systemctl status pi-vpn
sudo systemctl status wireguard
```

## Step 6: Configure Network

### 6.1 Set Static IP (Optional but Recommended)
```bash
# Edit network configuration
sudo nano /etc/dhcpcd.conf
```

Add at the end:
```
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8 1.1.1.1
```

### 6.2 Configure Port Forwarding (Router)
1. Access your router's admin interface
2. Navigate to Port Forwarding/Virtual Server
3. Add rule:
   - External Port: 51820
   - Internal IP: 192.168.1.100 (your Pi's IP)
   - Internal Port: 51820
   - Protocol: UDP

## Step 7: Access Web Interface

### 7.1 Open Web Interface
1. Open your browser
2. Navigate to `http://192.168.1.100:3000`
3. Login with default credentials:
   - Username: `admin`
   - Password: `password`

### 7.2 Change Default Password
1. Go to Settings
2. Update admin password
3. Save changes

## Step 8: Generate Client Configurations

### 8.1 Add VPN Clients
1. Go to "VPN Clients" section
2. Click "Add Client"
3. Enter client name and type
4. Download configuration file

### 8.2 Mobile Setup
1. Install WireGuard app
2. Generate client config in web interface
3. Scan QR code with WireGuard app
4. Connect to VPN

## Verification

### Check VPN Status
```bash
# Check WireGuard status
sudo wg show

# Check service status
sudo systemctl status wireguard
sudo systemctl status pi-vpn

# Check logs
sudo journalctl -u wireguard -f
sudo journalctl -u pi-vpn -f
```

### Test Connection
1. Connect a client device
2. Verify internet access through VPN
3. Check web interface for connected clients

## Troubleshooting

### Common Issues

**VPN service won't start:**
```bash
# Check WireGuard installation
sudo apt install wireguard

# Check configuration
sudo wg-quick up wg0

# Check logs
sudo journalctl -u wireguard
```

**Web interface not accessible:**
```bash
# Check if service is running
sudo systemctl status pi-vpn

# Check port binding
sudo netstat -tlnp | grep 3000

# Check firewall
sudo ufw status
```

**Client can't connect:**
- Verify client configuration
- Check server IP and port
- Ensure firewall allows VPN traffic
- Check router port forwarding

### Log Locations
- Application logs: `/home/pi/pi-vpn/logs/`
- System logs: `journalctl -u pi-vpn`
- WireGuard logs: `journalctl -u wireguard`

## Security Hardening

### 1. Change Default Credentials
- Update admin password
- Use strong JWT secret
- Enable HTTPS in production

### 2. Firewall Configuration
```bash
# Review firewall rules
sudo ufw status verbose

# Add additional rules if needed
sudo ufw allow from 192.168.1.0/24 to any port 22
```

### 3. System Updates
```bash
# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### 4. SSH Security
```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Use key-based authentication
ssh-keygen -t rsa -b 4096
ssh-copy-id pi@your-pi-ip
```

## Next Steps

1. **Configure Backup:** Set up automated backups
2. **Monitor Performance:** Enable monitoring and alerts
3. **Update Regularly:** Keep system and dependencies updated
4. **Document Configuration:** Keep notes of your setup
5. **Test Regularly:** Verify VPN functionality periodically

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Review logs for error messages
3. Search existing issues on GitHub
4. Create a new issue with detailed information