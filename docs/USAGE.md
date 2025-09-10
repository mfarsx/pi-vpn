# Usage Guide

This guide covers how to use Pi VPN's web interface and features effectively.

## Web Interface Overview

The Pi VPN web interface provides a comprehensive dashboard for managing your VPN server, connected devices, and client configurations.

### Navigation

- **Dashboard:** Overview of VPN status, statistics, and controls
- **Devices:** Network device discovery and management
- **VPN Clients:** Client configuration generation and management
- **Settings:** System and VPN configuration

## Dashboard

### VPN Status
The dashboard displays real-time information about your VPN server:

- **Status Indicator:** Shows if VPN is online/offline
- **Connected Clients:** Number of active VPN connections
- **Total Devices:** Devices discovered on your network
- **Uptime:** How long the VPN has been running

### Control Buttons
- **Start VPN:** Start the VPN service
- **Stop VPN:** Stop the VPN service
- **Restart VPN:** Restart the VPN service

### Network Traffic
- **Downloaded:** Total bytes received through VPN
- **Uploaded:** Total bytes sent through VPN

## Device Management

### Device Discovery
Pi VPN automatically scans your network for connected devices:

1. Go to the "Devices" section
2. Click "Scan Network" to discover new devices
3. View discovered devices with their details:
   - Device name and type
   - IP and MAC addresses
   - Manufacturer information
   - Connection status

### Device Actions
For each device, you can:

- **Block/Unblock:** Prevent or allow device internet access
- **View Details:** See detailed device information
- **Monitor Traffic:** View bandwidth usage statistics

### Device Information
Each device shows:
- **Name:** Device identifier
- **IP Address:** Network IP address
- **MAC Address:** Hardware address
- **Type:** Device category (mobile, laptop, etc.)
- **Status:** Online/offline status
- **Last Seen:** When device was last active

## VPN Client Management

### Adding Clients
1. Go to "VPN Clients" section
2. Click "Add Client"
3. Enter client information:
   - **Client Name:** Unique identifier
   - **Client Type:** Mobile, Desktop, or Server
4. Click "Generate Configuration"

### Client Configuration
After generating a client configuration:

- **Download Config:** Get the WireGuard configuration file
- **QR Code:** Generate QR code for mobile setup
- **View Config:** Preview the configuration

### Client Types
- **Mobile:** Full internet access (0.0.0.0/0)
- **Desktop:** Full internet access (0.0.0.0/0)
- **Server:** Limited to VPN network (10.0.0.0/24)

### Managing Clients
- **Revoke Access:** Remove client access
- **Regenerate Keys:** Create new keys for security
- **View Statistics:** See connection statistics

## Settings Configuration

### VPN Configuration
Configure your VPN server settings:

- **Server Port:** WireGuard port (default: 51820)
- **Server IP:** Your Pi's IP address
- **DNS Servers:** DNS servers for clients
- **Allowed IPs:** IP ranges clients can access

### Network Configuration
- **Network Name:** VPN network identifier
- **Subnet:** VPN network range
- **Gateway:** VPN gateway IP
- **DHCP Settings:** Automatic IP assignment

### Security Configuration
- **Encryption:** Encryption algorithm and key size
- **Firewall:** Firewall rules and policies
- **Access Control:** IP restrictions and time limits
- **Monitoring:** Connection logging and alerts

## Mobile Setup

### WireGuard App Installation
1. Install WireGuard from App Store (iOS) or Google Play (Android)
2. Open the app
3. Tap the "+" button to add a tunnel

### QR Code Setup
1. Generate client configuration in web interface
2. Click "QR Code" button
3. Scan QR code with WireGuard app
4. Tap "Add Tunnel" to save configuration
5. Tap the tunnel to connect

### Manual Setup
1. Download client configuration file
2. Import into WireGuard app
3. Configure tunnel settings
4. Connect to VPN

## Desktop Setup

### Windows
1. Download WireGuard for Windows
2. Install the application
3. Import configuration file or add manually
4. Connect to VPN

### macOS
1. Download WireGuard from Mac App Store
2. Install the application
3. Import configuration file
4. Connect to VPN

### Linux
1. Install WireGuard: `sudo apt install wireguard`
2. Copy configuration to `/etc/wireguard/`
3. Connect: `sudo wg-quick up client-name`

## Advanced Features

### Port Forwarding
Configure port forwarding for specific services:

1. Go to Settings > Network
2. Add port forwarding rules
3. Specify external and internal ports
4. Save configuration

### Bandwidth Limiting
Set bandwidth limits for clients:

1. Go to Settings > Network
2. Enable bandwidth limiting
3. Set download/upload limits
4. Apply to specific clients

### Quality of Service (QoS)
Prioritize traffic for better performance:

1. Enable QoS in network settings
2. Configure traffic priorities
3. Set bandwidth allocation
4. Monitor performance

### Access Control
Control client access based on:

- **Time Restrictions:** Allow access only during specific hours
- **IP Restrictions:** Limit access to specific IP ranges
- **Country Restrictions:** Block/allow specific countries
- **Device Restrictions:** Limit per-device connections

## Monitoring and Logs

### Real-time Monitoring
- **Connection Status:** Live connection monitoring
- **Traffic Statistics:** Real-time bandwidth usage
- **System Resources:** CPU, memory, and disk usage
- **Performance Metrics:** Response times and throughput

### Log Management
- **Connection Logs:** VPN connection/disconnection events
- **Traffic Logs:** Bandwidth usage and data transfer
- **Security Logs:** Authentication and access attempts
- **System Logs:** Application and system events

### Alerts and Notifications
Configure alerts for:
- **Connection Events:** New connections/disconnections
- **Security Events:** Failed login attempts
- **Performance Issues:** High resource usage
- **System Events:** Service failures or restarts

## Backup and Recovery

### Configuration Backup
1. Go to Settings > System
2. Click "Export Configuration"
3. Download configuration file
4. Store securely for recovery

### Automatic Backups
Enable automatic backups:
1. Configure backup schedule
2. Set retention period
3. Choose backup location
4. Monitor backup status

### Recovery Process
1. Restore from backup file
2. Verify configuration
3. Restart services
4. Test functionality

## Troubleshooting

### Common Issues

**Client can't connect:**
- Verify client configuration
- Check server IP and port
- Ensure firewall allows VPN traffic
- Check router port forwarding

**Slow performance:**
- Check bandwidth limits
- Monitor system resources
- Verify network configuration
- Consider QoS settings

**Web interface issues:**
- Check if service is running
- Verify port accessibility
- Check browser compatibility
- Review error logs

### Diagnostic Tools

**Connection Test:**
```bash
# Test VPN connection
ping 10.0.0.1

# Check routing
ip route show

# Verify DNS
nslookup google.com
```

**Performance Test:**
```bash
# Check bandwidth
iperf3 -c server-ip

# Monitor resources
htop
```

**Log Analysis:**
```bash
# View application logs
tail -f logs/combined.log

# Check system logs
journalctl -u pi-vpn -f
```

## Best Practices

### Security
- Use strong passwords
- Enable two-factor authentication
- Regular security updates
- Monitor access logs
- Use HTTPS in production

### Performance
- Monitor resource usage
- Optimize bandwidth allocation
- Regular system maintenance
- Update dependencies
- Monitor network performance

### Maintenance
- Regular backups
- Update configurations
- Monitor logs
- Test functionality
- Document changes

## Support

### Getting Help
1. Check this documentation
2. Review troubleshooting section
3. Search existing issues
4. Create detailed issue report

### Reporting Issues
When reporting issues, include:
- System information
- Error messages
- Steps to reproduce
- Log files
- Configuration details