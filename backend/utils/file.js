const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const { TEMP_UPLOADS_DIR } = require('./constants');

/**
 * File utility helpers
 */
const fileUtils = {
    /**
     * Ensure the temporary uploads directory exists
     */
    ensureTempDir: async () => {
        try {
            await fs.mkdir(TEMP_UPLOADS_DIR, { recursive: true });
        } catch (err) {
            logger.error(`Failed to create temp directory at ${TEMP_UPLOADS_DIR}`, err);
        }
    },

    /**
     * Safely unlink a file from disk
     */
    safeUnlink: async (filePath) => {
        if (!filePath) return;
        try {
            // Resolve relative paths safely to the uploads directory
            const absolutePath = path.isAbsolute(filePath) 
                ? filePath 
                : path.join(TEMP_UPLOADS_DIR, path.basename(filePath));

            await fs.unlink(absolutePath);
            logger.info(`Successfully deleted file at: ${absolutePath}`);
            return true;
        } catch (err) {
            if (err.code !== 'ENOENT') {
                logger.error(`Error deleting file at ${filePath}`, err);
            }
            return false;
        }
    },

    /**
     * Read a file into a buffer safely
     */
    readToBuffer: async (filePath) => {
        try {
            const absolutePath = path.isAbsolute(filePath)
                ? filePath
                : path.join(TEMP_UPLOADS_DIR, path.basename(filePath));
            return await fs.readFile(absolutePath);
        } catch (err) {
            logger.error(`Error reading file to buffer: ${filePath}`, err);
            throw err;
        }
    },

    /**
     * Check if a path-traversal attempt is present
     */
    isSafeFilename: (filename) => {
        if (!filename) return false;
        return !filename.includes('..') && path.basename(filename) === filename;
    }
};

module.exports = fileUtils;
