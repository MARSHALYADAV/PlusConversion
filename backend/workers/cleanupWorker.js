const fs = require('fs').promises;
const path = require('path');
const FileLog = require('../models/FileLog');
const StorageService = require('../services/storageService');

const TEMP_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes
const LOCAL_TEMP_DIR = path.join(__dirname, '../../temp_uploads');

/**
 * Cleanup database logs and delete expired assets.
 */
async function cleanExpiredDatabaseFiles() {
    try {
        const expiredRecords = await FileLog.find({ expiresAt: { $lte: new Date() } });
        if (expiredRecords.length === 0) return;

        console.log(`Cleanup Worker: Found ${expiredRecords.length} expired file logs in DB. Purging...`);

        for (const record of expiredRecords) {
            await StorageService.deleteFile(record.storageId, record.storageType);
            await FileLog.deleteOne({ _id: record._id });
        }
    } catch (err) {
        console.warn('Cleanup Worker: MongoDB purge skip or failed (possibly no connection):', err.message);
    }
}

/**
 * Fallback Disk Cleanup: Scans local temp folder and unlinks files older than 15 minutes.
 * Guarantees zero-disk bloat even without MongoDB connection.
 */
async function cleanExpiredDiskFiles() {
    try {
        const files = await fs.readdir(LOCAL_TEMP_DIR);
        const now = Date.now();

        for (const file of files) {
            // Skip hidden system files
            if (file.startsWith('.')) continue;

            const filePath = path.join(LOCAL_TEMP_DIR, file);
            const stats = await fs.stat(filePath);
            const ageMs = now - stats.mtimeMs;

            if (ageMs > TEMP_EXPIRATION_MS) {
                console.log(`Cleanup Worker: Found orphaned file ${file} on disk (age: ${Math.round(ageMs/1000)}s). Unlinking...`);
                await fs.unlink(filePath);
            }
        }
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error('Cleanup Worker: Failed to scan/purge local disk temp folder:', err);
        }
    }
}

/**
 * Main worker bootstrap. Starts a background interval to maintain server disk hygiene.
 */
function startCleanupWorker(intervalMs = 60000) { // Runs every minute
    console.log(`Cleanup Worker: Registered to run every ${intervalMs / 1000}s.`);
    
    setInterval(async () => {
        // Purge expired storage files tracked in Database
        await cleanExpiredDatabaseFiles();

        // Purge expired files on local storage disk
        await cleanExpiredDiskFiles();
    }, intervalMs);
}

module.exports = {
    startCleanupWorker
};
