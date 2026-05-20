const archiver = require('archiver');
const ImageService = require('../../services/imageService');
const StorageService = require('../../services/cloudinary');
const FileLog = require('../../models/FileLog');
const response = require('../../utils/response');
const logger = require('../../utils/logger');
const { STATUS_CODES } = require('../../utils/constants');

// Helper to log processed files to DB if mongoose is connected
async function logProcessedFile(storageResult, originalName) {
    try {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
        await FileLog.create({
            storageId: storageResult.storageId,
            storageType: storageResult.type,
            originalName: originalName,
            size: storageResult.size,
            expiresAt: expiresAt
        });
        logger.info(`DB logged temporary asset: ${storageResult.storageId} expiring at ${expiresAt}`);
    } catch (err) {
        // Safe silent fail if MongoDB is not connected
        logger.debug('Database logging skipped for transient asset:', err.message);
    }
}

const imageController = {
    /**
     * Snap preview generation of an uploaded image
     */
    preview: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.error(res, 'No image file uploaded for preview', STATUS_CODES.BAD_REQUEST);
            }

            logger.info(`Controller: Generating fast preview for ${req.file.originalname}`);
            const previewBuffer = await ImageService.generatePreview(req.file);

            res.set('Content-Type', 'image/jpeg');
            return res.send(previewBuffer);
        } catch (err) {
            next(err);
        }
    },

    /**
     * Batch image conversions and target-size matching
     */
    convert: async (req, res, next) => {
        try {
            if (!req.files && !req.file) {
                return response.error(res, 'No image files uploaded for conversion', STATUS_CODES.BAD_REQUEST);
            }

            const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [req.file];
            const options = {
                format: req.body.format || 'png',
                quality: req.body.quality ? parseInt(req.body.quality) : 80,
                width: req.body.width ? parseInt(req.body.width) : null,
                height: req.body.height ? parseInt(req.body.height) : null,
                maintainAspect: req.body.maintainAspect === 'true',
                targetSize: req.body.targetSize ? parseFloat(req.body.targetSize) : null,
                keepMetadata: req.body.keepMetadata === 'true',
                useTransparency: req.body.useTransparency === 'true',
                backgroundColor: req.body.backgroundColor || '#ffffff'
            };

            logger.info(`Controller: Processing conversion to ${options.format} for ${files.length} images`);

            if (files.length === 1) {
                const result = await ImageService.processImage(files[0], options);
                const name = `converted.${result.format}`;
                const storageResult = await StorageService.uploadTempFile(name, result.buffer);

                await logProcessedFile(storageResult, name);

                return response.success(res, {
                    downloadUrl: storageResult.url,
                    filename: name,
                    size: storageResult.size
                });
            } else {
                const archive = archiver('zip', { zlib: { level: 9 } });
                const chunks = [];

                archive.on('data', chunk => chunks.push(chunk));

                const zipPromise = new Promise((resolve, reject) => {
                    archive.on('end', () => resolve(Buffer.concat(chunks)));
                    archive.on('error', err => reject(err));
                });

                for (const file of files) {
                    try {
                        const result = await ImageService.processImage(file, options);
                        const originalName = file.originalname.split('.').slice(0, -1).join('.');
                        archive.append(result.buffer, { name: `${originalName}_converted.${result.format}` });
                    } catch (err) {
                        logger.error(`Failed batch image processing for file: ${file.originalname}`, err);
                    }
                }

                await archive.finalize();
                const zipBuffer = await zipPromise;

                const name = 'converted_images.zip';
                const storageResult = await StorageService.uploadTempFile(name, zipBuffer);

                await logProcessedFile(storageResult, name);

                return response.success(res, {
                    downloadUrl: storageResult.url,
                    filename: name,
                    size: storageResult.size
                });
            }
        } catch (err) {
            next(err);
        }
    }
};

module.exports = imageController;
