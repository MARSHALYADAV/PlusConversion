const express = require('express');
const router = express.Router();
const ImageService = require('../services/imageService');
const StorageService = require('../services/storageService');
const FileLog = require('../models/FileLog');
const { generalLimiter, heavyOperationLimiter } = require('../middleware/rateLimiter');
const {
    uploadSingleImage,
    uploadMultipleImages,
    validateImageUploads
} = require('../middleware/fileValidator');
const { sanitizeUploadedFiles } = require('../middleware/sanitizer');

// Helper to log processed files to DB if connected
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
    } catch (err) {
        console.warn('DB logging skipped for processed file:', err.message);
    }
}

/**
 * Fast previews endpoint (Sends raw image back synchronously for snappy UI rendering)
 */
router.post('/preview', generalLimiter, uploadSingleImage, validateImageUploads, sanitizeUploadedFiles, async (req, res, next) => {
    try {
        console.log(`Generating preview for: ${req.file.originalname}`);
        const previewBuffer = await ImageService.generatePreview(req.file);

        res.set('Content-Type', 'image/jpeg');
        res.send(previewBuffer);
    } catch (err) {
        next(err);
    }
});

/**
 * Image Conversion and Optimizations API
 */
router.post('/convert', heavyOperationLimiter, uploadMultipleImages, validateImageUploads, sanitizeUploadedFiles, async (req, res, next) => {
    try {
        const files = req.files;
        const options = {
            format: req.body.format || 'png',
            quality: req.body.quality ? parseInt(req.body.quality) : 80,
            width: req.body.width ? parseInt(req.body.width) : null,
            height: req.body.height ? parseInt(req.body.height) : null,
            maintainAspect: req.body.maintainAspect === 'true',
            targetSize: req.body.targetSize ? parseInt(req.body.targetSize) : null,
            keepMetadata: req.body.keepMetadata === 'true',
            useTransparency: req.body.useTransparency === 'true',
            backgroundColor: req.body.backgroundColor || '#ffffff'
        };

        console.log(`Processing conversion to ${options.format} for ${files.length} images...`);

        if (files.length === 1) {
            // Single image conversion
            const result = await ImageService.processImage(files[0], options);
            const name = `converted.${result.format}`;
            const storageResult = await StorageService.uploadTempFile(name, result.buffer);

            await logProcessedFile(storageResult, name);

            res.json({
                success: true,
                downloadUrl: storageResult.url,
                filename: name,
                size: storageResult.size
            });
        } else {
            // Multi image conversion -> Pack into ZIP
            const archiver = require('archiver');
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
                    console.error(`Failed to process ${file.originalname}:`, err);
                }
            }

            await archive.finalize();

            const zipBuffer = await zipPromise;
            const name = 'converted_images.zip';
            const storageResult = await StorageService.uploadTempFile(name, zipBuffer);

            await logProcessedFile(storageResult, name);

            res.json({
                success: true,
                downloadUrl: storageResult.url,
                filename: name,
                size: storageResult.size
            });
        }
    } catch (err) {
        next(err);
    }
});

module.exports = router;
