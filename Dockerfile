# Pi VPN Dockerfile for Raspberry Pi Hosting Platform
FROM node:18-alpine

# Install system dependencies for VPN functionality
RUN apk add --no-cache \
    wireguard-tools \
    iptables \
    iproute2 \
    net-tools \
    curl \
    bash \
    sudo \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs data config/clients

# Create non-root user
RUN addgroup pi && \
    adduser -D -s /bin/bash -G pi pi && \
    echo 'pi ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Set ownership
RUN chown -R pi:pi /app

# Switch to non-root user
USER pi

# Expose ports (main app port + VPN port for WireGuard)
EXPOSE ${PORT:-3000} ${VPN_PORT:-51820}/udp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Default command
CMD ["npm", "start"]