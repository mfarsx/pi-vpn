#!/bin/bash

# Pi VPN Deployment Script for Raspberry Pi Hosting Platform
# This script prepares the Pi VPN project for deployment on the hosting platform

set -e

echo "🚀 Preparing Pi VPN for deployment on Raspberry Pi Hosting Platform..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the pi-vpn project root directory"
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p config/clients
mkdir -p logs
mkdir -p data

# Set proper permissions
echo "🔐 Setting proper permissions..."
chmod +x scripts/*.js 2>/dev/null || true

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your production settings"
fi

# Create a simple docker-compose override for hosting platform
echo "🐳 Creating docker-compose override for hosting platform..."
cat > docker-compose.hosting.yml << EOF
version: '3.8'

services:
  pi-vpn:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: pi-vpn
    restart: unless-stopped
    ports:
      - "\${PORT:-3000}:\${PORT:-3000}"
      - "\${VPN_PORT:-51820}:\${VPN_PORT:-51820}/udp"
    volumes:
      - ./config:/app/config
      - ./logs:/app/logs
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=\${PORT:-3000}
      - VPN_PORT=\${VPN_PORT:-51820}
    env_file:
      - .env.production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:\${PORT:-3000}/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    privileged: true  # Required for WireGuard and iptables
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
EOF

echo "✅ Pi VPN is ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to Git repository:"
echo "   git add ."
echo "   git commit -m 'Prepare for hosting platform deployment'"
echo "   git push origin main"
echo ""
echo "2. Use the hosting platform web interface to deploy:"
echo "   - Repository URL: https://github.com/mfarsx/pi-vpn.git"
echo "   - Domain: pi-vpn.mfarsx.dev"
echo "   - Port: 3000 (web interface)"
echo "   - VPN Port: 51820 (UDP - requires router port forwarding)"
echo "   - Environment variables: Use the ones from deployment-config.json"
echo ""
echo "🔧 Important notes:"
echo "- The container needs privileged mode for WireGuard functionality"
echo "- Make sure pi-vpn.mfarsx.dev points to your Raspberry Pi's IP"
echo "- Configure your router to forward port 51820 (UDP) for VPN access"
echo "- The hosting platform will handle SSL certificates automatically"
echo ""
echo "🎯 Your Pi VPN will be accessible at: https://pi-vpn.mfarsx.dev"
echo "🔗 VPN Server: mfarsx.dev:51820"