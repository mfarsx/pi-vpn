#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const execAsync = promisify(exec);

class DockerSetup {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.sslPath = path.join(this.projectRoot, 'ssl');
    }

    async run() {
        console.log('🐳 Starting Pi VPN Docker Setup...\n');

        try {
            await this.checkPrerequisites();
            await this.createDirectories();
            await this.generateSSL();
            await this.setupWireGuard();
            await this.buildImage();
            await this.createEnvironmentFile();
            
            console.log('\n✅ Docker setup completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('1. Start development: docker-compose -f docker-compose.dev.yml up');
            console.log('2. Start production: docker-compose -f docker-compose.prod.yml up');
            console.log('3. Access web interface: http://localhost:3000');
            console.log('4. Access with HTTPS: https://localhost (with nginx)');
            
        } catch (error) {
            console.error('\n❌ Docker setup failed:', error.message);
            process.exit(1);
        }
    }

    async checkPrerequisites() {
        console.log('🔍 Checking Docker prerequisites...');

        // Check if Docker is installed
        try {
            await execAsync('docker --version');
        } catch (error) {
            throw new Error('Docker is not installed. Please install Docker first.');
        }

        // Check if Docker Compose is installed
        try {
            await execAsync('docker-compose --version');
        } catch (error) {
            throw new Error('Docker Compose is not installed. Please install Docker Compose first.');
        }

        // Check if running as root or with sudo
        if (process.getuid() !== 0) {
            console.log('⚠️  Warning: Not running as root. Some features may require sudo.');
        }

        console.log('✅ Prerequisites check passed\n');
    }

    async createDirectories() {
        console.log('📁 Creating directories...');

        const directories = [
            this.sslPath,
            path.join(this.projectRoot, 'logs'),
            path.join(this.projectRoot, 'data'),
            path.join(this.projectRoot, 'config', 'clients')
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

    async generateSSL() {
        console.log('🔐 Generating SSL certificates...');

        try {
            // Generate private key
            await execAsync(`openssl genrsa -out ${this.sslPath}/pi-vpn.key 2048`);
            
            // Generate certificate signing request
            const csrConfig = `[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Pi VPN
OU = IT Department
CN = pi-vpn.local

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = pi-vpn.local
DNS.2 = localhost
IP.1 = 127.0.0.1
IP.2 = 192.168.1.100`;

            await fs.writeFile(`${this.sslPath}/csr.conf`, csrConfig);

            // Generate self-signed certificate
            await execAsync(`openssl req -new -x509 -key ${this.sslPath}/pi-vpn.key -out ${this.sslPath}/pi-vpn.crt -days 365 -config ${this.sslPath}/csr.conf -extensions v3_req`);

            // Set proper permissions
            await execAsync(`chmod 600 ${this.sslPath}/pi-vpn.key`);
            await execAsync(`chmod 644 ${this.sslPath}/pi-vpn.crt`);

            console.log('   SSL private key generated');
            console.log('   SSL certificate generated');
            console.log('✅ SSL certificates created\n');

        } catch (error) {
            throw new Error(`Failed to generate SSL certificates: ${error.message}`);
        }
    }

    async setupWireGuard() {
        console.log('🔧 Setting up WireGuard configuration...');

        try {
            // Generate WireGuard keys
            const { stdout: serverPrivateKey } = await execAsync('wg genkey');
            const { stdout: serverPublicKey } = await execAsync(`echo "${serverPrivateKey.trim()}" | wg pubkey`);
            const { stdout: presharedKey } = await execAsync('wg genpsk');

            // Update VPN configuration
            const vpnConfigPath = path.join(this.projectRoot, 'config', 'vpn.json');
            const vpnConfig = JSON.parse(await fs.readFile(vpnConfigPath, 'utf8'));
            
            vpnConfig.privateKey = serverPrivateKey.trim();
            vpnConfig.publicKey = serverPublicKey.trim();
            vpnConfig.presharedKey = presharedKey.trim();
            vpnConfig.createdAt = new Date().toISOString();
            vpnConfig.lastModified = new Date().toISOString();

            await fs.writeFile(vpnConfigPath, JSON.stringify(vpnConfig, null, 2));

            // Create WireGuard configuration
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
            await execAsync('chmod 600 /etc/wireguard/wg0.conf');

            console.log('   WireGuard keys generated');
            console.log('   WireGuard configuration created');
            console.log('✅ WireGuard setup completed\n');

        } catch (error) {
            throw new Error(`Failed to setup WireGuard: ${error.message}`);
        }
    }

    async buildImage() {
        console.log('🏗️ Building Docker image...');

        try {
            await execAsync('docker build -t pi-vpn:latest .');
            console.log('✅ Docker image built successfully\n');
        } catch (error) {
            throw new Error(`Failed to build Docker image: ${error.message}`);
        }
    }

    async createEnvironmentFile() {
        console.log('🌍 Creating environment file...');

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

            console.log('✅ Environment file ready\n');

        } catch (error) {
            throw new Error(`Failed to create environment file: ${error.message}`);
        }
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new DockerSetup();
    setup.run().catch(error => {
        console.error('Docker setup failed:', error);
        process.exit(1);
    });
}

module.exports = DockerSetup;