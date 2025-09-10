# Docker Setup Guide

This guide covers how to run Pi VPN using Docker containers for easy deployment and management.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Linux host with kernel modules for WireGuard
- Root or sudo access for privileged containers

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/mfarsx/pi-vpn.git
cd pi-vpn
npm run docker:setup
```

### 2. Run Development Environment

```bash
npm run docker:dev
```

### 3. Run Production Environment

```bash
npm run docker:prod
```

## Docker Compose Files

### Development (`docker-compose.dev.yml`)
- Hot reload enabled
- Volume mounting for live code changes
- Development environment variables
- Optional Redis for caching

### Production (`docker-compose.prod.yml`)
- Optimized for production
- Nginx reverse proxy with SSL
- Logging configuration
- Health checks

### Base (`docker-compose.yml`)
- Basic configuration
- Optional nginx profile

## Container Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│   Pi VPN App    │────│   WireGuard     │
│   (Port 80/443) │    │   (Port 3000/1) │    │   (Port 51820)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Configuration

### Environment Variables

Create a `.env` file with:

```env
NODE_ENV=production
PORT=3001
CLIENT_PORT=3000
JWT_SECRET=your-super-secret-jwt-key
VPN_INTERFACE=wg0
VPN_PORT=51820
```

### Volume Mounts

- `./config:/app/config` - Configuration files
- `./data:/app/data` - Application data
- `./logs:/app/logs` - Log files
- `/etc/wireguard:/etc/wireguard` - WireGuard configs
- `/lib/modules:/lib/modules:ro` - Kernel modules

## SSL/TLS Setup

### Automatic SSL Generation

The setup script automatically generates self-signed certificates:

```bash
npm run docker:setup
```

This creates:
- `ssl/pi-vpn.key` - Private key
- `ssl/pi-vpn.crt` - Certificate

### Custom SSL Certificates

Replace the generated certificates with your own:

```bash
# Copy your certificates
cp your-cert.crt ssl/pi-vpn.crt
cp your-key.key ssl/pi-vpn.key

# Set proper permissions
chmod 644 ssl/pi-vpn.crt
chmod 600 ssl/pi-vpn.key
```

## Network Configuration

### Host Network Mode

The containers use `network_mode: host` for:
- Direct access to network interfaces
- WireGuard kernel module access
- Simplified networking

### Port Mapping

- **3000** - Web interface
- **3001** - API server
- **51820/UDP** - WireGuard VPN
- **80** - HTTP (nginx)
- **443** - HTTPS (nginx)

## Security Considerations

### Privileged Containers

The Pi VPN container runs with `privileged: true` to:
- Access network interfaces
- Load kernel modules
- Modify iptables rules

### Capabilities

Required capabilities:
- `NET_ADMIN` - Network administration
- `SYS_MODULE` - Load kernel modules

### Device Access

Required devices:
- `/dev/net/tun` - TUN/TAP interface

## Management Commands

### Development

```bash
# Start development environment
npm run docker:dev

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

### Production

```bash
# Start production environment
npm run docker:prod

# Start with nginx
docker-compose -f docker-compose.prod.yml --profile with-nginx up

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Maintenance

```bash
# Build image
npm run docker:build

# Clean up
npm run docker:clean

# Update containers
docker-compose pull
docker-compose up -d
```

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs pi-vpn

# Check WireGuard module
lsmod | grep wireguard

# Check permissions
ls -la /dev/net/tun
```

**Network issues:**
```bash
# Check IP forwarding
sysctl net.ipv4.ip_forward

# Check iptables
iptables -L

# Check WireGuard interface
wg show
```

**SSL issues:**
```bash
# Check certificate
openssl x509 -in ssl/pi-vpn.crt -text -noout

# Test SSL connection
openssl s_client -connect localhost:443
```

### Debug Mode

Run container in debug mode:

```bash
docker run -it --rm --privileged \
  --network host \
  --cap-add NET_ADMIN \
  --cap-add SYS_MODULE \
  --device /dev/net/tun \
  -v $(pwd):/app \
  pi-vpn:latest bash
```

## Performance Optimization

### Resource Limits

Add resource limits to docker-compose.yml:

```yaml
services:
  pi-vpn:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### Logging

Configure log rotation:

```yaml
services:
  pi-vpn:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Backup and Restore

### Backup

```bash
# Backup configuration
docker run --rm -v pi-vpn_config:/data -v $(pwd):/backup alpine \
  tar czf /backup/config-backup.tar.gz -C /data .

# Backup data
docker run --rm -v pi-vpn_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/data-backup.tar.gz -C /data .
```

### Restore

```bash
# Restore configuration
docker run --rm -v pi-vpn_config:/data -v $(pwd):/backup alpine \
  tar xzf /backup/config-backup.tar.gz -C /data

# Restore data
docker run --rm -v pi-vpn_data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/data-backup.tar.gz -C /data
```

## Monitoring

### Health Checks

The containers include health checks:

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# View health check logs
docker inspect pi-vpn-server | jq '.[0].State.Health'
```

### Metrics

Access metrics endpoints:

- Health: `http://localhost:3001/health`
- Metrics: `http://localhost:3001/metrics` (if enabled)

## Production Deployment

### Docker Swarm

Deploy using Docker Swarm:

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml pi-vpn
```

### Kubernetes

Convert to Kubernetes manifests:

```bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.28.0/kompose-linux-amd64 -o kompose
chmod +x kompose
sudo mv kompose /usr/local/bin/

# Convert
kompose convert -f docker-compose.prod.yml
```

## Support

For Docker-related issues:
1. Check container logs: `docker-compose logs`
2. Verify prerequisites: Docker, WireGuard modules
3. Check network configuration
4. Review security settings

## Security Notes

- Change default passwords
- Use strong JWT secrets
- Enable firewall rules
- Regular security updates
- Monitor access logs
- Use HTTPS in production