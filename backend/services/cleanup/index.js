const fs = require('fs').promises;
const path = require('path');
const FileLog = require('../../models/FileLog');
const StorageService = require('../cloudinary');
const logger = require('../../utils/logger');
const { TEMP_CLEANUP_MINUTES, TEMP_UPLOADS_DIR } = require('../../utils/constants');

const TEMP_EXPIRATION_MS = TEMP_CLEANUP_MINUTES * 60 * 1000;

class CleanupService {
    /**
     * Purges expired records in MongoDB and deletes their corresponding stored files.
     */
    static async cleanExpiredDatabaseFiles() {
        try {
            const expiredRecords = await FileLog.find({ expiresAt: { $lte: new Date() } });
            if (expiredRecords.length === 0) return;

            logger.info(`Cleanup Service: Found ${expiredRecords.length} expired file logs in DB. Purging...`);

            for (const record of expiredRecords) {
                await StorageService.deleteFile(record.storageId, record.storageType);
                await FileLog.deleteOne({ _id: record._id });
            }
        } catch (err) {
            logger.warn(`Cleanup Service: MongoDB purge skipped or failed: ${err.message}`);
        }
    }

    /**
     * Fallback Disk Cleanup: Scans local temp folder and unlinks files older than 15 minutes.
     * Guarantees zero-disk bloat even without MongoDB connection.
     */
    static async cleanExpiredDiskFiles() {
        try {
            const files = await fs.readdir(TEMP_UPLOADS_DIR);
            const now = Date.now();

            for (const file of files) {
                if (file.startsWith('.')) continue; // Skip hidden/system files

                const filePath = path.join(TEMP_UPLOADS_DIR, file);
                const stats = await fs.stat(filePath);
                const ageMs = now - stats.mtimeMs;

                if (ageMs > TEMP_EXPIRATION_MS) {
                    logger.info(`Cleanup Service: Found orphaned file ${file} on disk (age: ${Math.round(ageMs/1000)}s). Unlinking...`);
                    await fs.unlink(filePath);
                }
            }
        } catch (err) {
            if (err.code !== 'ENOENT') {
                logger.error('Cleanup Service: Failed to scan or purge local disk temp folder', err);
            }
        }
    }

    /**
     * Bootstraps the periodic execution of the file cleanup loops.
     */
    static start(intervalMs = 60000) {
        logger.info(`Cleanup Service: Starting background job runner (interval: ${intervalMs / 1000}s)`);
        
        setInterval(async () => {
            await this.cleanExpiredDatabaseFiles();
            await this.cleanExpiredDiskFiles();
        }, intervalMs);
    }
}

module.exports = CleanupService;
