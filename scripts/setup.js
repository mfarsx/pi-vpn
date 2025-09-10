#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const execAsync = promisify(exec);

class PiVPNSetup {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.configPath = path.join(this.projectRoot, 'config');
        this.dataPath = path.join(this.projectRoot, 'data');
        this.logsPath = path.join(this.projectRoot, 'logs');
        this.clientConfigsPath = path.join(this.projectRoot, 'config', 'clients');
    }

    async run() {
        console.log('🚀 Starting Pi VPN Setup...\n');

        try {
            await this.checkPrerequisites();
            await this.createDirectories();
            await this.generateKeys();
            await this.setupWireGuard();
            await this.configureFirewall();
            await this.createSystemdService();
            await this.setupEnvironment();
            await this.initializeDatabase();
            
            console.log('\n✅ Pi VPN setup completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('1. Start the services: sudo systemctl start pi-vpn wireguard');
            console.log('2. Access web interface: http://your-pi-ip:3000');
            console.log('3. Login with: admin / password');
            console.log('4. Change default password immediately!');
            console.log('5. Configure your router port forwarding (UDP 51820)');
            
        } catch (error) {
            console.error('\n❌ Setup failed:', error.message);
            process.exit(1);
        }
    }

    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');

        // Check if running as root or with sudo
        if (process.getuid() !== 0) {
            throw new Error('This script must be run with sudo privileges');
        }

        // Check Node.js version
        const { stdout: nodeVersion } = await execAsync('node --version');
        const version = nodeVersion.trim().substring(1);
        const majorVersion = parseInt(version.split('.')[0]);
        
        if (majorVersion < 16) {
            throw new Error(`Node.js 16+ required, found ${version}`);
        }

        // Check if WireGuard is installed
        try {
            await execAsync('which wg');
        } catch (error) {
            console.log('📦 Installing WireGuard...');
            await execAsync('apt update && apt install -y wireguard wireguard-tools');
        }

        // Check if UFW is installed
        try {
            await execAsync('which ufw');
        } catch (error) {
            console.log('📦 Installing UFW...');
            await execAsync('apt install -y ufw');
        }

        console.log('✅ Prerequisites check passed\n');
    }

    async createDirectories() {
        console.log('📁 Creating directories...');

        const directories = [
            this.configPath,
            this.dataPath,
            this.logsPath,
            this.clientConfigsPath,
            path.join(this.configPath, 'defaults')
        ];

        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`   Created: ${dir}`);
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw error;
                }
            }
        }

        console.log('✅ Directories created\n');
    }

    async generateKeys() {
        console.log('🔑 Generating WireGuard keys...');

        try {
            // Generate server private key
            const { stdout: serverPrivateKey } = await execAsync('wg genkey');
            
            // Generate server public key
            const { stdout: serverPublicKey } = await execAsync(`echo "${serverPrivateKey.trim()}" | wg pubkey`);

            // Generate preshared key
            const { stdout: presharedKey } = await execAsync('wg genpsk');

            // Update VPN configuration
            const vpnConfigPath = path.join(this.configPath, 'vpn.json');
            const vpnConfig = JSON.parse(await fs.readFile(vpnConfigPath, 'utf8'));
            
            vpnConfig.privateKey = serverPrivateKey.trim();
            vpnConfig.publicKey = serverPublicKey.trim();
            vpnConfig.presharedKey = presharedKey.trim();
            vpnConfig.createdAt = new Date().toISOString();
            vpnConfig.lastModified = new Date().toISOString();

            await fs.writeFile(vpnConfigPath, JSON.stringify(vpnConfig, null, 2));

            console.log('   Server private key generated');
            console.log('   Server public key generated');
            console.log('   Preshared key generated');
            console.log('✅ WireGuard keys generated\n');

        } catch (error) {
            throw new Error(`Failed to generate keys: ${error.message}`);
        }
    }

    async setupWireGuard() {
        console.log('🔧 Setting up WireGuard...');

        try {
            // Enable IP forwarding
            await execAsync('echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf');
            await execAsync('sysctl -p');

            // Create WireGuard configuration
            const vpnConfigPath = path.join(this.configPath, 'vpn.json');
            const vpnConfig = JSON.parse(await fs.readFile(vpnConfigPath, 'utf8'));

            const wgConfig = `[Interface]
PrivateKey = ${vpnConfig.privateKey}
Address = ${vpnConfig.serverIP}/24
ListenPort = ${vpnConfig.port}
PostUp = ${vpnConfig.preUp}
PostDown = ${vpnConfig.postDown}

# Enable IP forwarding
PostUp = sysctl -w net.ipv4.ip_forward=1
PostDown = sysctl -w net.ipv4.ip_forward=0`;

            await fs.writeFile('/etc/wireguard/wg0.conf', wgConfig);

            // Set proper permissions
            await execAsync('chmod 600 /etc/wireguard/wg0.conf');

            // Enable WireGuard service
            await execAsync('systemctl enable wg-quick@wg0');

            console.log('   WireGuard configuration created');
            console.log('   IP forwarding enabled');
            console.log('   WireGuard service enabled');
            console.log('✅ WireGuard setup completed\n');

        } catch (error) {
            throw new Error(`Failed to setup WireGuard: ${error.message}`);
        }
    }

    async configureFirewall() {
        console.log('🔥 Configuring firewall...');

        try {
            // Reset UFW to defaults
            await execAsync('ufw --force reset');

            // Set default policies
            await execAsync('ufw default deny incoming');
            await execAsync('ufw default allow outgoing');

            // Allow SSH
            await execAsync('ufw allow ssh');

            // Allow WireGuard
            const vpnConfigPath = path.join(this.configPath, 'vpn.json');
            const vpnConfig = JSON.parse(await fs.readFile(vpnConfigPath, 'utf8'));
            await execAsync(`ufw allow ${vpnConfig.port}/udp`);

            // Allow web interface
            await execAsync('ufw allow 3000/tcp');
            await execAsync('ufw allow 3001/tcp');

            // Enable firewall
            await execAsync('ufw --force enable');

            console.log('   Default policies set');
            console.log('   SSH access allowed');
            console.log(`   WireGuard port ${vpnConfig.port}/udp allowed`);
            console.log('   Web interface ports allowed');
            console.log('✅ Firewall configured\n');

        } catch (error) {
            throw new Error(`Failed to configure firewall: ${error.message}`);
        }
    }

    async createSystemdService() {
        console.log('⚙️ Creating systemd service...');

        try {
            const serviceContent = `[Unit]
Description=Pi VPN Server
After=network.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=${this.projectRoot}
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_PATH=${this.projectRoot}

[Install]
WantedBy=multi-user.target`;

            await fs.writeFile('/etc/systemd/system/pi-vpn.service', serviceContent);

            // Reload systemd and enable service
            await execAsync('systemctl daemon-reload');
            await execAsync('systemctl enable pi-vpn');

            console.log('   Service file created');
            console.log('   Service enabled');
            console.log('✅ Systemd service created\n');

        } catch (error) {
            throw new Error(`Failed to create systemd service: ${error.message}`);
        }
    }

    async setupEnvironment() {
        console.log('🌍 Setting up environment...');

        try {
            const envPath = path.join(this.projectRoot, '.env');
            
            // Check if .env exists, if not copy from example
            try {
                await fs.access(envPath);
                console.log('   .env file already exists, skipping...');
            } catch (error) {
                const envExamplePath = path.join(this.projectRoot, '.env.example');
                const envExample = await fs.readFile(envExamplePath, 'utf8');
                
                // Generate JWT secret
                const jwtSecret = crypto.randomBytes(64).toString('hex');
                const envContent = envExample.replace('your-super-secret-jwt-key-change-this-in-production', jwtSecret);
                
                await fs.writeFile(envPath, envContent);
                console.log('   .env file created with generated JWT secret');
            }

            console.log('✅ Environment setup completed\n');

        } catch (error) {
            throw new Error(`Failed to setup environment: ${error.message}`);
        }
    }

    async initializeDatabase() {
        console.log('💾 Initializing database...');

        try {
            // Create empty devices database
            const devicesPath = path.join(this.dataPath, 'devices.json');
            await fs.writeFile(devicesPath, JSON.stringify([], null, 2));

            // Create initial admin user (will be created on first login)
            console.log('   Devices database initialized');
            console.log('   Admin user will be created on first login');
            console.log('✅ Database initialized\n');

        } catch (error) {
            throw new Error(`Failed to initialize database: ${error.message}`);
        }
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new PiVPNSetup();
    setup.run().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = PiVPNSetup;