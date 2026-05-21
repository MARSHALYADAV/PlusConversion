const archiver = require('archiver');
const PdfService = require('../../services/pdf');
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

const pdfController = {
    /**
     * Merge multiple PDF files
     */
    merge: async (req, res, next) => {
        try {
            if (!req.files || req.files.length < 2) {
                return response.error(res, 'At least two PDF files are required for merging', STATUS_CODES.BAD_REQUEST);
            }

            const buffers = req.files.map(file => file.buffer);
            logger.info(`Controller: Merging ${req.files.length} PDFs`);

            const mergedBuffer = await PdfService.merge(buffers);
            const storageResult = await StorageService.uploadTempFile('merged.pdf', mergedBuffer);

            await logProcessedFile(storageResult, 'merged.pdf');

            return response.success(res, {
                downloadUrl: storageResult.url,
                filename: 'merged.pdf',
                size: storageResult.size
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Split a PDF file
     */
    split: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.error(res, 'No PDF file uploaded for splitting', STATUS_CODES.BAD_REQUEST);
            }

            const { pageRange } = req.body;
            logger.info(`Controller: Splitting PDF (range: ${pageRange || 'all'})`);

            const splitPages = await PdfService.split(req.file.buffer, pageRange);

            if (splitPages.length === 1) {
                // Return single page PDF directly
                const pageData = splitPages[0];
                const name = `split_page_${pageData.pageIndex}.pdf`;
                const storageResult = await StorageService.uploadTempFile(name, pageData.buffer);

                await logProcessedFile(storageResult, name);

                return response.success(res, {
                    downloadUrl: storageResult.url,
                    filename: name,
                    size: storageResult.size
                });
            } else {
                // Compile multiple pages into a ZIP stream in-memory
                const archive = archiver('zip', { zlib: { level: 9 } });
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

                return response.success(res, {
                    downloadUrl: storageResult.url,
                    filename: name,
                    size: storageResult.size
                });
            }
        } catch (err) {
            next(err);
        }
    },

    /**
     * Rotate a PDF file
     */
    rotate: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.error(res, 'No PDF file uploaded for rotation', STATUS_CODES.BAD_REQUEST);
            }

            const angle = parseInt(req.body.angle) || 90;
            logger.info(`Controller: Rotating PDF by ${angle} degrees`);

            const rotatedBuffer = await PdfService.rotate(req.file.buffer, angle);
            const name = `rotated_${req.file.originalname}`;
            const storageResult = await StorageService.uploadTempFile(name, rotatedBuffer);

            await logProcessedFile(storageResult, name);

            return response.success(res, {
                downloadUrl: storageResult.url,
                filename: name,
                size: storageResult.size
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Watermark a PDF file
     */
    watermark: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.error(res, 'No PDF file uploaded for watermarking', STATUS_CODES.BAD_REQUEST);
            }

            const { text, size, color, opacity, rotation } = req.body;
            logger.info(`Controller: Watermarking PDF with text "${text}"`);

            const watermarkedBuffer = await PdfService.watermark(req.file.buffer, text, {
                size: size ? parseInt(size) : 50,
                color: color || '#cccccc',
                opacity: opacity ? parseFloat(opacity) : 0.4,
                rotation: rotation ? parseInt(rotation) : -45
            });

            const name = `watermarked_${req.file.originalname}`;
            const storageResult = await StorageService.uploadTempFile(name, watermarkedBuffer);

            await logProcessedFile(storageResult, name);

            return response.success(res, {
                downloadUrl: storageResult.url,
                filename: name,
                size: storageResult.size
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Add page numbers to a PDF file
     */
    addPageNumbers: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.error(res, 'No PDF file uploaded for page numbering', STATUS_CODES.BAD_REQUEST);
            }

            const { position, fontSize, format } = req.body;
            logger.info(`Controller: Adding page numbers to PDF`);

            const numberedBuffer = await PdfService.addPageNumbers(req.file.buffer, {
                position: position || 'bottom',
                fontSize: fontSize ? parseInt(fontSize) : 10,
                format: format || 'Page {num} of {total}'
            });

            const name = `numbered_${req.file.originalname}`;
            const storageResult = await StorageService.uploadTempFile(name, numberedBuffer);

            await logProcessedFile(storageResult, name);

            return response.success(res, {
                downloadUrl: storageResult.url,
                filename: name,
                size: storageResult.size
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Compress a PDF file
     */
    compress: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.error(res, 'No PDF file uploaded for compression', STATUS_CODES.BAD_REQUEST);
            }

            const mode = req.body.mode || 'recommended';
            logger.info(`Controller: Compressing PDF in ${mode} mode`);

            const compressedBuffer = await PdfService.compress(req.file.buffer, mode);
            const name = `compressed_${req.file.originalname}`;
            const storageResult = await StorageService.uploadTempFile(name, compressedBuffer);

            await logProcessedFile(storageResult, name);

            return response.success(res, {
                downloadUrl: storageResult.url,
                filename: name,
                size: storageResult.size
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Compile JPG / PNG images into a PDF file
     */
    imagesToPdf: async (req, res, next) => {
        try {
            if (!req.files || req.files.length === 0) {
                return response.error(res, 'No image files uploaded for PDF compilation', STATUS_CODES.BAD_REQUEST);
            }

            logger.info(`Controller: Compiling ${req.files.length} images into PDF`);

            const pdfBuffer = await PdfService.imagesToPdf(req.files);
            const name = 'converted_images.pdf';
            const storageResult = await StorageService.uploadTempFile(name, pdfBuffer);

            await logProcessedFile(storageResult, name);

            return response.success(res, {
                downloadUrl: storageResult.url,
                filename: name,
                size: storageResult.size
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Decrypt/Unlock a PDF file
     */
    unlock: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.error(res, 'No PDF file uploaded for unlocking', STATUS_CODES.BAD_REQUEST);
            }

            const { password } = req.body;
            logger.info(`Controller: Unlocking PDF`);

            try {
                const decryptedBuffer = await PdfService.unlock(req.file.buffer, password || '');
                const name = `unlocked_${req.file.originalname}`;
                const storageResult = await StorageService.uploadTempFile(name, decryptedBuffer);

                await logProcessedFile(storageResult, name);

                return response.success(res, {
                    downloadUrl: storageResult.url,
                    filename: name,
                    size: storageResult.size
                });
            } catch (err) {
                if (err.message === 'PASSWORD_REQUIRED') {
                    return response.error(res, 'Password is required to unlock this PDF', STATUS_CODES.BAD_REQUEST, { code: 'PASSWORD_REQUIRED' });
                } else if (err.message === 'INVALID_PASSWORD') {
                    return response.error(res, 'Incorrect password. Please try again', STATUS_CODES.BAD_REQUEST, { code: 'INVALID_PASSWORD' });
                }
                throw err;
            }
        } catch (err) {
            next(err);
        }
    },

    /**
     * Edit PDF file using coordinate-based vector/text/image annotations
     */
    edit: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.error(res, 'No PDF file uploaded for editing', STATUS_CODES.BAD_REQUEST);
            }

            let annotations = [];
            if (req.body.annotations) {
                try {
                    annotations = JSON.parse(req.body.annotations);
                } catch (parseErr) {
                    return response.error(res, 'Invalid annotations JSON matrix format', STATUS_CODES.BAD_REQUEST);
                }
            }

            logger.info(`Controller: Editing PDF with ${annotations.length} annotations`);

            const editedBuffer = await PdfService.edit(req.file.buffer, annotations);
            const name = `edited_${req.file.originalname}`;
            const storageResult = await StorageService.uploadTempFile(name, editedBuffer);

            await logProcessedFile(storageResult, name);

            return response.success(res, {
                downloadUrl: storageResult.url,
                filename: name,
                size: storageResult.size
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Convert Office Documents (Word, Excel, PowerPoint) to PDF
     */
    convertOffice: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.error(res, 'No office document file uploaded', STATUS_CODES.BAD_REQUEST);
            }

            const ext = req.file.originalname.split('.').pop().toLowerCase();
            logger.info(`Controller: Converting ${ext} to PDF`);

            const pdfBuffer = await PdfService.convertOffice(req.file.buffer, ext);
            
            const baseName = req.file.originalname.substring(0, req.file.originalname.lastIndexOf('.')) || 'converted';
            const name = `${baseName}.pdf`;
            
            const storageResult = await StorageService.uploadTempFile(name, pdfBuffer);

            await logProcessedFile(storageResult, name);

            return response.success(res, {
                downloadUrl: storageResult.url,
                filename: name,
                size: storageResult.size
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = pdfController;
