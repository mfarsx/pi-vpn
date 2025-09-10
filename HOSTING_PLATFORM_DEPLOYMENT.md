# Pi VPN - Hosting Platform Deployment Guide

## 🚨 **Important: VPN Port Limitation**

**The hosting platform has a critical limitation**: It only supports **single port mapping** for web applications, but Pi VPN needs **two ports**:
- **Port 3000**: Web interface (HTTP/HTTPS)
- **Port 51820**: WireGuard VPN server (UDP)

## ⚠️ **Current Limitations**

### **1. VPN Port Issue**
- **Problem**: Hosting platform only maps port 3000
- **Impact**: VPN clients cannot connect (no UDP port 51820)
- **Workaround**: Manual router port forwarding required

### **2. Privileged Mode Issue**
- **Problem**: Hosting platform doesn't support privileged containers
- **Impact**: WireGuard may not work without privileged access
- **Workaround**: May need platform modification

### **3. Docker Compose Issue**
- **Problem**: Platform generates `compose.yaml`, we have `docker-compose.yml`
- **Impact**: Platform may not find our compose file
- **Workaround**: Rename file or modify platform

## 🚀 **Deployment Steps**

### **1. Prepare Repository**
```bash
# Ensure your code is pushed to GitHub
git add .
git commit -m "Prepare for hosting platform deployment"
git push origin main
```

### **2. Deploy via Hosting Platform API**

**Method 1: Web Interface**
1. Go to `https://mfarsx.dev/deploy`
2. Enter deployment details:
   - **Name**: `pi-vpn`
   - **Domain**: `pi-vpn.mfarsx.dev`
   - **Repository**: `https://github.com/mfarsx/pi-vpn.git`
   - **Branch**: `main`
   - **Port**: `3000`
   - **Environment Variables**: Copy from `hosting-platform-deploy.json`

**Method 2: API Call**
```bash
curl -X POST https://mfarsx.dev/api/projects/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @hosting-platform-deploy.json
```

### **3. Required Manual Setup**

**Router Configuration (CRITICAL)**
```bash
# Forward VPN port manually in your router
# Port: 51820 (UDP)
# Target: Your Raspberry Pi's IP
```

**DNS Configuration**
```bash
# Point domain to your Pi's IP
# A Record: pi-vpn.mfarsx.dev → YOUR_PI_IP
```

## 🔧 **Platform Modifications Needed**

### **1. Support Multiple Ports**
The hosting platform needs to be modified to support multiple port mappings:

```yaml
# Current platform limitation
ports:
  - "${project.port}:${project.port}"

# Needed for Pi VPN
ports:
  - "${project.port}:${project.port}"
  - "${project.vpn_port}:${project.vpn_port}/udp"
```

### **2. Support Privileged Mode**
The platform needs to support privileged containers:

```yaml
# Add to generated compose file
privileged: true
cap_add:
  - NET_ADMIN
  - SYS_MODULE
```

### **3. Support Custom Docker Compose**
Allow projects to use their own `docker-compose.yml` instead of generating `compose.yaml`.

## 📋 **Deployment Configuration**

### **API Request Format**
```json
{
  "name": "pi-vpn",
  "domain": "pi-vpn.mfarsx.dev",
  "repository": "https://github.com/mfarsx/pi-vpn.git",
  "branch": "main",
  "buildCommand": "npm ci --only=production",
  "startCommand": "npm start",
  "port": 3000,
  "environment": {
    "NODE_ENV": "production",
    "PORT": "3000",
    "CLIENT_URL": "https://pi-vpn.mfarsx.dev",
    "JWT_SECRET": "pi-vpn-jwt-secret-key-2024-production-mfarsx-dev-secure",
    "VPN_INTERFACE": "wg0",
    "VPN_PORT": "51820",
    "VPN_NETWORK": "10.0.0.0/24",
    "VPN_SERVER_IP": "10.0.0.1",
    "ENABLE_HTTPS": "true",
    "LOG_LEVEL": "info",
    "MONITORING_ENABLED": "true",
    "EXTERNAL_DNS": "8.8.8.8,1.1.1.1",
    "EXTERNAL_NTP": "pool.ntp.org"
  }
}
```

## 🎯 **Expected Results**

### **✅ What Will Work**
- **Web Interface**: `https://pi-vpn.mfarsx.dev` ✅
- **API Endpoints**: All REST API endpoints ✅
- **Health Checks**: `/health` endpoint ✅
- **Authentication**: Login/logout ✅
- **Client Management**: Generate configs ✅

### **❌ What Won't Work (Without Platform Modifications)**
- **VPN Connections**: Clients can't connect ❌
- **WireGuard Server**: May not start properly ❌
- **Real-time VPN Status**: Limited functionality ❌

## 🔄 **Workarounds**

### **1. Manual VPN Port Forwarding**
```bash
# In your router settings
# Forward port 51820 (UDP) to your Pi's IP
# This allows VPN clients to connect
```

### **2. Alternative Deployment**
```bash
# Deploy web interface only via hosting platform
# Run VPN server separately with manual Docker commands
docker run -d --name pi-vpn-vpn \
  --privileged \
  --cap-add=NET_ADMIN \
  --cap-add=SYS_MODULE \
  -p 51820:51820/udp \
  -v /etc/wireguard:/etc/wireguard \
  pi-vpn:latest
```

## 📞 **Next Steps**

### **Option 1: Modify Hosting Platform**
1. Update `dockerService.js` to support multiple ports
2. Add privileged mode support
3. Allow custom compose files

### **Option 2: Hybrid Deployment**
1. Deploy web interface via hosting platform
2. Run VPN server separately with manual setup
3. Configure router port forwarding

### **Option 3: Alternative Platform**
1. Use different hosting solution that supports VPN
2. Deploy both web and VPN together

## 🎯 **Recommendation**

**For immediate deployment**: Use **Option 2 (Hybrid Deployment)**:
1. Deploy web interface via hosting platform
2. Run VPN server separately with privileged access
3. Configure manual port forwarding

**For full integration**: Modify the hosting platform to support VPN requirements.

---

**⚠️ The hosting platform needs modifications to fully support Pi VPN deployment!**