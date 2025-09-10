#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class PiVPNDeploy {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.backupPath = '/var/backups/pi-vpn';
        this.deployPath = '/opt/pi-vpn';
    }

    async run() {
        console.log('🚀 Starting Pi VPN Deployment...\n');

        try {
            await this.checkPrerequisites();
            await this.createBackup();
            await this.stopServices();
            await this.deployApplication();
            await this.updatePermissions();
            await this.startServices();
            await this.verifyDeployment();
            
            console.log('\n✅ Pi VPN deployment completed successfully!');
            console.log('\n📋 Deployment Summary:');
            console.log(`   Application deployed to: ${this.deployPath}`);
            console.log(`   Backup created at: ${this.backupPath}`);
            console.log('   Services restarted and verified');
            console.log('\n🌐 Access your VPN at: http://your-pi-ip:3000');
            
        } catch (error) {
            console.error('\n❌ Deployment failed:', error.message);
            await this.rollback();
            process.exit(1);
        }
    }

    async checkPrerequisites() {
        console.log('🔍 Checking deployment prerequisites...');

        // Check if running as root
        if (process.getuid() !== 0) {
            throw new Error('Deployment must be run with sudo privileges');
        }

        // Check if application is built
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        try {
            await fs.access(packageJsonPath);
        } catch (error) {
            throw new Error('package.json not found. Are you in the correct directory?');
        }

        // Check if services exist
        try {
            await execAsync('systemctl is-enabled pi-vpn');
        } catch (error) {
            throw new Error('Pi VPN service not found. Run setup first.');
        }

        console.log('✅ Prerequisites check passed\n');
    }

    async createBackup() {
        console.log('💾 Creating backup...');

        try {
            // Create backup directory
            await execAsync(`mkdir -p ${this.backupPath}`);

            // Create timestamped backup
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = `${this.backupPath}/backup-${timestamp}`;
            await execAsync(`mkdir -p ${backupDir}`);

            // Backup current deployment if it exists
            try {
                await execAsync(`cp -r ${this.deployPath} ${backupDir}/current`);
                console.log('   Current deployment backed up');
            } catch (error) {
                console.log('   No current deployment to backup');
            }

            // Backup configuration
            await execAsync(`cp -r ${this.projectRoot}/config ${backupDir}/`);
            await execAsync(`cp -r ${this.projectRoot}/data ${backupDir}/`);
            await execAsync(`cp ${this.projectRoot}/.env ${backupDir}/ 2>/dev/null || true`);

            console.log(`✅ Backup created at ${backupDir}\n`);

        } catch (error) {
            throw new Error(`Failed to create backup: ${error.message}`);
        }
    }

    async stopServices() {
        console.log('⏹️ Stopping services...');

        try {
            await execAsync('systemctl stop pi-vpn');
            console.log('   Pi VPN service stopped');
            
            // Don't stop WireGuard as it might be in use
            console.log('   WireGuard service left running');
            console.log('✅ Services stopped\n');

        } catch (error) {
            console.log('   Services already stopped or not running');
        }
    }

    async deployApplication() {
        console.log('📦 Deploying application...');

        try {
            // Create deployment directory
            await execAsync(`mkdir -p ${this.deployPath}`);

            // Copy application files
            await execAsync(`cp -r ${this.projectRoot}/server ${this.deployPath}/`);
            await execAsync(`cp -r ${this.projectRoot}/client ${this.deployPath}/`);
            await execAsync(`cp -r ${this.projectRoot}/config ${this.deployPath}/`);
            await execAsync(`cp -r ${this.projectRoot}/data ${this.deployPath}/`);
            await execAsync(`cp ${this.projectRoot}/package.json ${this.deployPath}/`);
            await execAsync(`cp ${this.projectRoot}/.env ${this.deployPath}/ 2>/dev/null || true`);

            // Install production dependencies
            console.log('   Installing production dependencies...');
            await execAsync(`cd ${this.deployPath} && npm ci --production`);

            // Update systemd service to point to new location
            const serviceContent = `[Unit]
Description=Pi VPN Server
After=network.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=${this.deployPath}
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_PATH=${this.deployPath}

[Install]
WantedBy=multi-user.target`;

            await fs.writeFile('/etc/systemd/system/pi-vpn.service', serviceContent);
            await execAsync('systemctl daemon-reload');

            console.log('✅ Application deployed\n');

        } catch (error) {
            throw new Error(`Failed to deploy application: ${error.message}`);
        }
    }

    async updatePermissions() {
        console.log('🔐 Updating permissions...');

        try {
            // Set ownership
            await execAsync(`chown -R pi:pi ${this.deployPath}`);

            // Set permissions
            await execAsync(`chmod -R 755 ${this.deployPath}`);
            await execAsync(`chmod 600 ${this.deployPath}/.env`);
            await execAsync(`chmod 600 ${this.deployPath}/config/vpn.json`);

            // Set WireGuard permissions
            await execAsync('chmod 600 /etc/wireguard/wg0.conf');

            console.log('✅ Permissions updated\n');

        } catch (error) {
            throw new Error(`Failed to update permissions: ${error.message}`);
        }
    }

    async startServices() {
        console.log('▶️ Starting services...');

        try {
            await execAsync('systemctl start pi-vpn');
            console.log('   Pi VPN service started');

            // Wait a moment for service to start
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('✅ Services started\n');

        } catch (error) {
            throw new Error(`Failed to start services: ${error.message}`);
        }
    }

    async verifyDeployment() {
        console.log('🔍 Verifying deployment...');

        try {
            // Check service status
            const { stdout: serviceStatus } = await execAsync('systemctl is-active pi-vpn');
            if (serviceStatus.trim() !== 'active') {
                throw new Error('Pi VPN service is not active');
            }

            // Check if web interface is accessible
            const { stdout: portCheck } = await execAsync('netstat -tlnp | grep :3000');
            if (!portCheck.includes(':3000')) {
                throw new Error('Web interface port not listening');
            }

            // Check WireGuard status
            try {
                await execAsync('wg show');
                console.log('   WireGuard interface active');
            } catch (error) {
                console.log('   WireGuard interface not active (will start on first client connection)');
            }

            console.log('✅ Deployment verified\n');

        } catch (error) {
            throw new Error(`Deployment verification failed: ${error.message}`);
        }
    }

    async rollback() {
        console.log('🔄 Rolling back deployment...');

        try {
            // Stop current service
            await execAsync('systemctl stop pi-vpn');

            // Find latest backup
            const { stdout: backups } = await execAsync(`ls -t ${this.backupPath} | head -1`);
            const latestBackup = backups.trim();

            if (latestBackup) {
                // Restore from backup
                await execAsync(`rm -rf ${this.deployPath}`);
                await execAsync(`cp -r ${this.backupPath}/${latestBackup}/current ${this.deployPath}`);

                // Restore configuration
                await execAsync(`cp -r ${this.backupPath}/${latestBackup}/config ${this.deployPath}/`);
                await execAsync(`cp -r ${this.backupPath}/${latestBackup}/data ${this.deployPath}/`);
                await execAsync(`cp ${this.backupPath}/${latestBackup}/.env ${this.deployPath}/ 2>/dev/null || true`);

                // Restart service
                await execAsync('systemctl start pi-vpn');

                console.log('✅ Rollback completed');
            } else {
                console.log('❌ No backup found for rollback');
            }

        } catch (error) {
            console.error('❌ Rollback failed:', error.message);
        }
    }
}

// Run deployment if called directly
if (require.main === module) {
    const deploy = new PiVPNDeploy();
    deploy.run().catch(error => {
        console.error('Deployment failed:', error);
        process.exit(1);
    });
}

module.exports = PiVPNDeploy;