const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Auto-configure Cloudinary if environment keys are present
const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('Storage Service: Cloudinary configured successfully.');
} else {
    console.log('Storage Service: Cloudinary variables not detected. Defaulting to local transient file system.');
}

const LOCAL_TEMP_DIR = path.join(__dirname, '../../temp_uploads');

// Ensure local temporary directory exists
async function ensureLocalTempDir() {
    try {
        await fs.mkdir(LOCAL_TEMP_DIR, { recursive: true });
    } catch (err) {
        console.error('Failed to create local temp storage directory:', err);
    }
}
ensureLocalTempDir();

class StorageService {
    /**
     * Uploads an ephemeral file buffer to storage.
     * Returns metadata containing storage details.
     */
    static async uploadTempFile(filename, buffer) {
        const uniqueId = `${Date.now()}_${Math.round(Math.random() * 1E9)}`;
        const fileExt = path.extname(filename);
        const nameWithoutExt = path.basename(filename, fileExt);
        const storageFilename = `${nameWithoutExt}_${uniqueId}${fileExt}`;

        if (isCloudinaryConfigured) {
            try {
                // Cloudinary upload stream fallback
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
                                console.error('Cloudinary upload failure:', error);
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
                console.warn('Cloudinary upload failed, falling back to local file storage:', err);
            }
        }

        // Local Storage Fallback
        const filePath = path.join(LOCAL_TEMP_DIR, storageFilename);
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
     */
    static async getLocalFileBuffer(storageId) {
        const filePath = path.join(LOCAL_TEMP_DIR, storageId);
        return await fs.readFile(filePath);
    }

    /**
     * Deletes a temporary file from either local disk or Cloudinary.
     */
    static async deleteFile(storageId, type = 'local') {
        if (type === 'cloudinary' && isCloudinaryConfigured) {
            try {
                await cloudinary.uploader.destroy(storageId);
                console.log(`Successfully deleted Cloudinary asset: ${storageId}`);
                return true;
            } catch (err) {
                console.error(`Failed to delete Cloudinary asset ${storageId}:`, err);
                return false;
            }
        }

        // Local delete
        try {
            const filePath = path.join(LOCAL_TEMP_DIR, storageId);
            await fs.unlink(filePath);
            console.log(`Successfully deleted local transient file: ${storageId}`);
            return true;
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error(`Failed to delete local file ${storageId}:`, err);
            }
            return false;
        }
    }
}

module.exports = StorageService;
