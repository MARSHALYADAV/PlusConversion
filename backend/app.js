const express = require('express');
const path = require('path');
const { helmetMiddleware, corsMiddleware } = require('./middleware/securityHeaders');
const errorHandler = require('./middleware/errorHandler');
const pdfRoutes = require('./api/routes/pdfRoutes');
const imageRoutes = require('./api/routes/imageRoutes');
const StorageService = require('./services/cloudinary');
const FileLog = require('./models/FileLog');
const logger = require('./utils/logger');
const fileUtils = require('./utils/file');
const response = require('./utils/response');
const { STATUS_CODES } = require('./utils/constants');

const app = express();

// Apply Security Middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from the frontend/public path
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Mount API routes
app.use('/api/pdf', pdfRoutes);
app.use('/api/image', imageRoutes);

/**
 * Safe Temporary File Retrieval Endpoint (for local disk transient assets)
 */
app.get('/temp/:storageId', async (req, res, next) => {
    try {
        const { storageId } = req.params;
        
        // Strict protection against directory traversal attacks
        if (!fileUtils.isSafeFilename(storageId)) {
            logger.warn(`Directory traversal attempt blocked: ${storageId}`);
            return response.error(res, 'Access denied.', STATUS_CODES.FORBIDDEN);
        }

        const fileBuffer = await StorageService.getLocalFileBuffer(storageId);
        
        // Look up original file details to restore natural filenames
        let filename = 'download';
        let mimeType = 'application/octet-stream';

        try {
            const log = await FileLog.findOne({ storageId });
            if (log) {
                filename = log.originalName;
                const ext = path.extname(filename).toLowerCase();
                if (ext === '.pdf') mimeType = 'application/pdf';
                else if (ext === '.zip') mimeType = 'application/zip';
                else if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
                else if (ext === '.png') mimeType = 'image/png';
                else if (ext === '.webp') mimeType = 'image/webp';
            }
        } catch (dbErr) {
            // Keep generic file name if MongoDB is not connected
            const ext = path.extname(storageId).toLowerCase();
            if (ext === '.pdf') {
                filename = 'converted.pdf';
                mimeType = 'application/pdf';
            } else if (ext === '.zip') {
                filename = 'converted_images.zip';
                mimeType = 'application/zip';
            } else {
                filename = `converted${ext}`;
            }
        }

        res.set('Content-Type', mimeType);
        res.set('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(fileBuffer);
    } catch (err) {
        logger.warn(`Failed downloading transient asset: ${err.message}`);
        return response.error(res, 'File expired, deleted, or does not exist.', STATUS_CODES.NOT_FOUND);
    }
});

// Serve frontend home route for spa routing fallback
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
