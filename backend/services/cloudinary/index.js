const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;
const config = require('../../config');
const logger = require('../../utils/logger');
const fileUtils = require('../../utils/file');
const { TEMP_UPLOADS_DIR } = require('../../utils/constants');

// Auto-configure Cloudinary if environment keys are present
const isCloudinaryConfigured = !!(config.CLOUDINARY.CLOUD_NAME && config.CLOUDINARY.API_KEY && config.CLOUDINARY.API_SECRET);

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: config.CLOUDINARY.CLOUD_NAME,
        api_key: config.CLOUDINARY.API_KEY,
        api_secret: config.CLOUDINARY.API_SECRET
    });
    logger.info('Cloudinary storage engine configured successfully.');
} else {
    logger.info('Cloudinary variables not detected. Defaulting to local transient file system.');
}

// Ensure temp upload dir exists
fileUtils.ensureTempDir();

class StorageService {
    /**
     * Check if Cloudinary is active
     */
    static isCloudinaryActive() {
        return isCloudinaryConfigured;
    }

    /**
     * Uploads an ephemeral file buffer to storage.
     * @param {string} filename
     * @param {Buffer} buffer
     * @returns {Promise<object>} Storage metadata
     */
    static async uploadTempFile(filename, buffer) {
        const uniqueId = `${Date.now()}_${Math.round(Math.random() * 1E9)}`;
        const fileExt = path.extname(filename);
        const nameWithoutExt = path.basename(filename, fileExt);
        const storageFilename = `${nameWithoutExt}_${uniqueId}${fileExt}`;

        if (isCloudinaryConfigured) {
            try {
                return new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: 'auto',
                            public_id: `plusconversion/temp_${uniqueId}`,
                            folder: 'plusconversion_temp',
                            overwrite: true
                        },
                        (error, result) => {
                            if (error) {
                                logger.error('Cloudinary upload failure, trying local fallback:', error);
                                reject(error);
                            } else {
                                resolve({
                                    storageId: result.public_id,
                                    url: result.secure_url,
                                    size: result.bytes,
                                    type: 'cloudinary',
                                    uploadedAt: new Date()
                                });
                            }
                        }
                    );
                    uploadStream.end(buffer);
                });
            } catch (err) {
                logger.warn('Cloudinary upload stream errored, falling back to local file storage.');
            }
        }

        // Local Storage Fallback
        const filePath = path.join(TEMP_UPLOADS_DIR, storageFilename);
        await fs.writeFile(filePath, buffer);

        return {
            storageId: storageFilename,
            url: `/temp/${storageFilename}`,
            filePath: filePath,
            size: buffer.length,
            type: 'local',
            uploadedAt: new Date()
        };
    }

    /**
     * Retrieve local file buffer (used in local storage download server endpoint)
     * @param {string} storageId
     * @returns {Promise<Buffer>}
     */
    static async getLocalFileBuffer(storageId) {
        return await fileUtils.readToBuffer(storageId);
    }

    /**
     * Deletes a temporary file from either local disk or Cloudinary.
     * @param {string} storageId
     * @param {string} type - 'local' or 'cloudinary'
     * @returns {Promise<boolean>}
     */
    static async deleteFile(storageId, type = 'local') {
        if (type === 'cloudinary' && isCloudinaryConfigured) {
            try {
                await cloudinary.uploader.destroy(storageId);
                logger.info(`Successfully deleted Cloudinary asset: ${storageId}`);
                return true;
            } catch (err) {
                logger.error(`Failed to delete Cloudinary asset ${storageId}`, err);
                return false;
            }
        }

        // Local delete
        return await fileUtils.safeUnlink(storageId);
    }
}

module.exports = StorageService;
