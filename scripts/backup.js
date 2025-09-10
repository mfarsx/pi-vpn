#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const execAsync = promisify(exec);

class PiVPNBackup {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.backupPath = '/var/backups/pi-vpn';
        this.configPath = path.join(this.projectRoot, 'config');
        this.dataPath = path.join(this.projectRoot, 'data');
        this.logsPath = path.join(this.projectRoot, 'logs');
    }

    async run() {
        console.log('💾 Starting Pi VPN Backup...\n');

        try {
            await this.checkPrerequisites();
            await this.createBackupDirectory();
            await this.backupConfiguration();
            await this.backupData();
            await this.backupLogs();
            await this.backupWireGuard();
            await this.createBackupManifest();
            await this.cleanupOldBackups();
            
            console.log('\n✅ Backup completed successfully!');
            console.log(`📁 Backup location: ${this.backupPath}`);
            
        } catch (error) {
            console.error('\n❌ Backup failed:', error.message);
            process.exit(1);
        }
    }

    async checkPrerequisites() {
        console.log('🔍 Checking backup prerequisites...');

        // Check if running as root
        if (process.getuid() !== 0) {
            throw new Error('Backup must be run with sudo privileges');
        }

        // Check if backup directory is writable
        try {
            await fs.access(this.backupPath, fs.constants.W_OK);
        } catch (error) {
            console.log('📁 Creating backup directory...');
            await execAsync(`mkdir -p ${this.backupPath}`);
            await execAsync(`chown pi:pi ${this.backupPath}`);
        }

        console.log('✅ Prerequisites check passed\n');
    }

    async createBackupDirectory() {
        console.log('📁 Creating backup directory...');

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            this.backupDir = `${this.backupPath}/backup-${timestamp}`;
            
            await execAsync(`mkdir -p ${this.backupDir}`);
            console.log(`   Created: ${this.backupDir}`);
            console.log('✅ Backup directory created\n');

        } catch (error) {
            throw new Error(`Failed to create backup directory: ${error.message}`);
        }
    }

    async backupConfiguration() {
        console.log('⚙️ Backing up configuration...');

        try {
            const configBackupDir = `${this.backupDir}/config`;
            await execAsync(`mkdir -p ${configBackupDir}`);

            // Backup all configuration files
            await execAsync(`cp -r ${this.configPath}/* ${configBackupDir}/`);
            
            // Backup environment file
            try {
                await execAsync(`cp ${this.projectRoot}/.env ${configBackupDir}/`);
            } catch (error) {
                console.log('   .env file not found, skipping...');
            }

            // Backup WireGuard configuration
            await execAsync(`cp /etc/wireguard/wg0.conf ${configBackupDir}/wg0.conf`);

            console.log('   Configuration files backed up');
            console.log('   WireGuard config backed up');
            console.log('✅ Configuration backup completed\n');

        } catch (error) {
            throw new Error(`Failed to backup configuration: ${error.message}`);
        }
    }

    async backupData() {
        console.log('💾 Backing up data...');

        try {
            const dataBackupDir = `${this.backupDir}/data`;
            await execAsync(`mkdir -p ${dataBackupDir}`);

            // Backup device database
            await execAsync(`cp -r ${this.dataPath}/* ${dataBackupDir}/`);

            // Backup client configurations
            const clientConfigsPath = path.join(this.projectRoot, 'config', 'clients');
            try {
                await execAsync(`cp -r ${clientConfigsPath} ${dataBackupDir}/clients`);
            } catch (error) {
                console.log('   No client configurations found');
            }

            console.log('   Device database backed up');
            console.log('   Client configurations backed up');
            console.log('✅ Data backup completed\n');

        } catch (error) {
            throw new Error(`Failed to backup data: ${error.message}`);
        }
    }

    async backupLogs() {
        console.log('📋 Backing up logs...');

        try {
            const logsBackupDir = `${this.backupDir}/logs`;
            await execAsync(`mkdir -p ${logsBackupDir}`);

            // Backup application logs
            try {
                await execAsync(`cp -r ${this.logsPath}/* ${logsBackupDir}/`);
            } catch (error) {
                console.log('   No application logs found');
            }

            // Backup system logs
            await execAsync(`journalctl -u pi-vpn --since "7 days ago" > ${logsBackupDir}/pi-vpn-system.log`);
            await execAsync(`journalctl -u wireguard --since "7 days ago" > ${logsBackupDir}/wireguard-system.log`);

            console.log('   Application logs backed up');
            console.log('   System logs backed up');
            console.log('✅ Logs backup completed\n');

        } catch (error) {
            throw new Error(`Failed to backup logs: ${error.message}`);
        }
    }

    async backupWireGuard() {
        console.log('🔐 Backing up WireGuard state...');

        try {
            const wgBackupDir = `${this.backupDir}/wireguard`;
            await execAsync(`mkdir -p ${wgBackupDir}`);

            // Backup WireGuard interface state
            try {
                await execAsync(`wg show wg0 > ${wgBackupDir}/wg0-state.txt`);
            } catch (error) {
                console.log('   WireGuard interface not active');
            }

            // Backup iptables rules
            await execAsync(`iptables-save > ${wgBackupDir}/iptables-rules.txt`);

            // Backup network configuration
            await execAsync(`ip route show > ${wgBackupDir}/routes.txt`);
            await execAsync(`ip addr show > ${wgBackupDir}/interfaces.txt`);

            console.log('   WireGuard state backed up');
            console.log('   Network configuration backed up');
            console.log('✅ WireGuard backup completed\n');

        } catch (error) {
            throw new Error(`Failed to backup WireGuard: ${error.message}`);
        }
    }

    async createBackupManifest() {
        console.log('📄 Creating backup manifest...');

        try {
            const manifest = {
                timestamp: new Date().toISOString(),
                version: await this.getApplicationVersion(),
                backupId: crypto.randomUUID(),
                systemInfo: await this.getSystemInfo(),
                files: await this.getBackupFileList(),
                checksums: await this.calculateChecksums()
            };

            const manifestPath = `${this.backupDir}/manifest.json`;
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

            console.log('   Backup manifest created');
            console.log(`   Backup ID: ${manifest.backupId}`);
            console.log('✅ Backup manifest completed\n');

        } catch (error) {
            throw new Error(`Failed to create backup manifest: ${error.message}`);
        }
    }

    async cleanupOldBackups() {
        console.log('🧹 Cleaning up old backups...');

        try {
            // Get backup retention from configuration
            const systemConfigPath = path.join(this.projectRoot, 'config', 'system.json');
            let retentionDays = 7; // Default retention

            try {
                const systemConfig = JSON.parse(await fs.readFile(systemConfigPath, 'utf8'));
                retentionDays = systemConfig.backupRetention || 7;
            } catch (error) {
                console.log('   Using default retention period (7 days)');
            }

            // Find old backups
            const { stdout: backups } = await execAsync(`find ${this.backupPath} -maxdepth 1 -type d -name "backup-*" -mtime +${retentionDays}`);
            
            if (backups.trim()) {
                const oldBackups = backups.trim().split('\n');
                for (const backup of oldBackups) {
                    await execAsync(`rm -rf "${backup}"`);
                    console.log(`   Removed: ${path.basename(backup)}`);
                }
            } else {
                console.log('   No old backups to remove');
            }

            console.log('✅ Cleanup completed\n');

        } catch (error) {
            console.log('   Cleanup failed, but backup was successful');
        }
    }

    async getApplicationVersion() {
        try {
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            return packageJson.version || '1.0.0';
        } catch (error) {
            return 'unknown';
        }
    }

    async getSystemInfo() {
        try {
            const { stdout: hostname } = await execAsync('hostname');
            const { stdout: osInfo } = await execAsync('uname -a');
            const { stdout: diskUsage } = await execAsync('df -h /');
            
            return {
                hostname: hostname.trim(),
                os: osInfo.trim(),
                diskUsage: diskUsage.trim()
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    async getBackupFileList() {
        try {
            const { stdout: files } = await execAsync(`find ${this.backupDir} -type f -exec ls -la {} \\;`);
            return files.trim().split('\n').map(line => {
                const parts = line.trim().split(/\s+/);
                return {
                    permissions: parts[0],
                    size: parts[4],
                    date: parts[5] + ' ' + parts[6] + ' ' + parts[7],
                    path: parts.slice(8).join(' ')
                };
            });
        } catch (error) {
            return [];
        }
    }

    async calculateChecksums() {
        try {
            const { stdout: checksums } = await execAsync(`find ${this.backupDir} -type f -exec sha256sum {} \\;`);
            const checksumMap = {};
            
            checksums.trim().split('\n').forEach(line => {
                const [checksum, filepath] = line.split('  ');
                if (checksum && filepath) {
                    checksumMap[filepath] = checksum;
                }
            });
            
            return checksumMap;
        } catch (error) {
            return {};
        }
    }
}

// Run backup if called directly
if (require.main === module) {
    const backup = new PiVPNBackup();
    backup.run().catch(error => {
        console.error('Backup failed:', error);
        process.exit(1);
    });
}

module.exports = PiVPNBackup;