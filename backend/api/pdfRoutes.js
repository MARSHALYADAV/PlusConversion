const express = require('express');
const router = express.Router();
const PdfService = require('../services/pdfService');
const StorageService = require('../services/storageService');
const FileLog = require('../models/FileLog');
const { heavyOperationLimiter } = require('../middleware/rateLimiter');
const {
    uploadSinglePdf,
    uploadMultiplePdfs,
    uploadMultipleImages,
    validatePdfUploads,
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
        // Fallback silently if DB is not connected
        console.warn('DB logging skipped for processed file:', err.message);
    }
}

/**
 * Merge PDFs API
 */
router.post('/merge', heavyOperationLimiter, uploadMultiplePdfs, validatePdfUploads, sanitizeUploadedFiles, async (req, res, next) => {
    try {
        const buffers = req.files.map(file => file.buffer);
        console.log(`Processing PDF Merge for ${req.files.length} files...`);

        const mergedBuffer = await PdfService.mergePdfs(buffers);
        const storageResult = await StorageService.uploadTempFile('merged.pdf', mergedBuffer);

        await logProcessedFile(storageResult, 'merged.pdf');

        res.json({
            success: true,
            downloadUrl: storageResult.url,
            filename: 'merged.pdf',
            size: storageResult.size
        });
    } catch (err) {
        next(err);
    }
});

/**
 * Split PDF API
 */
router.post('/split', heavyOperationLimiter, uploadSinglePdf, validatePdfUploads, sanitizeUploadedFiles, async (req, res, next) => {
    try {
        const pageRange = req.body.pageRange || '';
        console.log(`Processing PDF Split for ${req.file.originalname} (range: ${pageRange || 'all'})...`);

        const splitPages = await PdfService.splitPdf(req.file.buffer, pageRange);

        if (splitPages.length === 1) {
            // Return single PDF
            const pageData = splitPages[0];
            const name = `split_page_${pageData.pageIndex}.pdf`;
            const storageResult = await StorageService.uploadTempFile(name, pageData.buffer);

            await logProcessedFile(storageResult, name);

            res.json({
                success: true,
                downloadUrl: storageResult.url,
                filename: name,
                size: storageResult.size
            });
        } else {
            // Return ZIP of split pages
            const archiver = require('archiver');
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            // Build in memory buffer using stream
            const chunks = [];
            archive.on('data', chunk => chunks.push(chunk));
            
            const zipPromise = new Promise((resolve, reject) => {
                archive.on('end', () => resolve(Buffer.concat(chunks)));
                archive.on('error', err => reject(err));
            });

            for (const page of splitPages) {
                archive.append(page.buffer, { name: `page_${page.pageIndex}.pdf` });
            }
            await archive.finalize();

            const zipBuffer = await zipPromise;
            const name = 'split_pages.zip';
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

/**
 * Rotate PDF API
 */
router.post('/rotate', heavyOperationLimiter, uploadSinglePdf, validatePdfUploads, sanitizeUploadedFiles, async (req, res, next) => {
    try {
        const angle = parseInt(req.body.angle) || 90;
        console.log(`Processing PDF Rotate for ${req.file.originalname} (angle: ${angle})...`);

        const rotatedBuffer = await PdfService.rotatePdf(req.file.buffer, angle);
        const name = `rotated_${req.file.originalname}`;
        const storageResult = await StorageService.uploadTempFile(name, rotatedBuffer);

        await logProcessedFile(storageResult, name);

        res.json({
            success: true,
            downloadUrl: storageResult.url,
            filename: name,
            size: storageResult.size
        });
    } catch (err) {
        next(err);
    }
});

/**
 * Watermark PDF API
 */
router.post('/watermark', heavyOperationLimiter, uploadSinglePdf, validatePdfUploads, sanitizeUploadedFiles, async (req, res, next) => {
    try {
        const text = req.body.text || 'PlusConversion';
        const size = req.body.size ? parseInt(req.body.size) : 50;
        const color = req.body.color || '#cccccc';
        const opacity = req.body.opacity ? parseFloat(req.body.opacity) : 0.4;
        const rotation = req.body.rotation ? parseInt(req.body.rotation) : -45;

        console.log(`Processing PDF Watermark for ${req.file.originalname}...`);

        const watermarkedBuffer = await PdfService.watermarkPdf(req.file.buffer, text, {
            size, color, opacity, rotation
        });

        const name = `watermarked_${req.file.originalname}`;
        const storageResult = await StorageService.uploadTempFile(name, watermarkedBuffer);

        await logProcessedFile(storageResult, name);

        res.json({
            success: true,
            downloadUrl: storageResult.url,
            filename: name,
            size: storageResult.size
        });
    } catch (err) {
        next(err);
    }
});

/**
 * Add Page Numbers API
 */
router.post('/page-number', heavyOperationLimiter, uploadSinglePdf, validatePdfUploads, sanitizeUploadedFiles, async (req, res, next) => {
    try {
        const position = req.body.position || 'bottom';
        const fontSize = req.body.fontSize ? parseInt(req.body.fontSize) : 10;
        const format = req.body.format || 'Page {num} of {total}';

        console.log(`Processing PDF Page Numbering for ${req.file.originalname}...`);

        const numberedBuffer = await PdfService.addPageNumbers(req.file.buffer, {
            position, fontSize, format
        });

        const name = `numbered_${req.file.originalname}`;
        const storageResult = await StorageService.uploadTempFile(name, numberedBuffer);

        await logProcessedFile(storageResult, name);

        res.json({
            success: true,
            downloadUrl: storageResult.url,
            filename: name,
            size: storageResult.size
        });
    } catch (err) {
        next(err);
    }
});

/**
 * JPG to PDF Conversion API
 */
router.post('/images-to-pdf', heavyOperationLimiter, uploadMultipleImages, validateImageUploads, sanitizeUploadedFiles, async (req, res, next) => {
    try {
        console.log(`Processing Image to PDF conversion for ${req.files.length} files...`);

        const pdfBuffer = await PdfService.imagesToPdf(req.files);
        const name = 'converted_images.pdf';
        const storageResult = await StorageService.uploadTempFile(name, pdfBuffer);

        await logProcessedFile(storageResult, name);

        res.json({
            success: true,
            downloadUrl: storageResult.url,
            filename: name,
            size: storageResult.size
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
