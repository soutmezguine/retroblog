const fs = require('fs');
const path = require('path');
const db = require('./db');

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create a backup of the database
 */
function backupDatabase() {
    try {
        // Close any pending transactions
        db.exec('PRAGMA integrity_check');
        
        const dbPath = path.join(process.cwd(), 'database.sqlite');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.sqlite`);
        
        // Use sqlite3 backup API
        const backupDb = new (require('better-sqlite3'))(backupPath);
        const sql = db.exec('SELECT sql FROM sqlite_master WHERE sql IS NOT NULL');
        db.exec('VACUUM INTO ?', backupPath);
        
        return {
            success: true,
            filename: `backup-${timestamp}.sqlite`,
            path: backupPath,
            size: fs.statSync(backupPath).size,
            timestamp: new Date().toISOString()
        };
    } catch (err) {
        console.error('Backup failed:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * Get list of available backups
 */
function getBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const backups = files
            .filter(f => f.startsWith('backup-') && f.endsWith('.sqlite'))
            .map(filename => {
                const filepath = path.join(BACKUP_DIR, filename);
                const stats = fs.statSync(filepath);
                const timestamp = filename.replace('backup-', '').replace('.sqlite', '');
                return {
                    filename,
                    size: stats.size,
                    created: stats.mtime,
                    timestamp
                };
            })
            .sort((a, b) => b.created - a.created);
        
        return backups;
    } catch (err) {
        console.error('Failed to get backups:', err);
        return [];
    }
}

/**
 * Delete a specific backup
 */
function deleteBackup(filename) {
    try {
        if (!filename.startsWith('backup-') || !filename.endsWith('.sqlite')) {
            return { success: false, error: 'Invalid backup filename' };
        }
        
        const filepath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(filepath)) {
            return { success: false, error: 'Backup not found' };
        }
        
        fs.unlinkSync(filepath);
        return { success: true, message: 'Backup deleted' };
    } catch (err) {
        console.error('Failed to delete backup:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Restore database from a backup
 */
function restoreBackup(filename) {
    try {
        if (!filename.startsWith('backup-') || !filename.endsWith('.sqlite')) {
            return { success: false, error: 'Invalid backup filename' };
        }
        
        const backupPath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(backupPath)) {
            return { success: false, error: 'Backup not found' };
        }
        
        const dbPath = path.join(process.cwd(), 'database.sqlite');
        const restorePath = path.join(process.cwd(), `database-${Date.now()}.backup`);
        
        // Backup current database
        fs.copyFileSync(dbPath, restorePath);
        
        // Restore from backup
        fs.copyFileSync(backupPath, dbPath);
        
        return {
            success: true,
            message: 'Database restored successfully',
            previousBackupPath: restorePath
        };
    } catch (err) {
        console.error('Restore failed:', err);
        return { success: false, error: err.message };
    }
}

module.exports = {
    backupDatabase,
    getBackups,
    deleteBackup,
    restoreBackup
};
