const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const logger = require('../utils/logger');
const response = require('../utils/response');
const { STATUS_CODES, MAX_FILE_SIZE, MAX_PAGE_LIMIT, ALLOWED_EXTENSIONS } = require('../utils/constants');

const MAX_FILE_COUNT = 10;

// Setup memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
});

// Binary signature hex checking
const SIGNATURES = {
    pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
    png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    jpg: [0xFF, 0xD8, 0xFF],
    webp: [0x52, 0x49, 0x46, 0x46], // RIFF
    bmp: [0x42, 0x4D] // BM
};

function checkBufferSignature(buffer, sig) {
    if (!buffer || buffer.length < sig.length) return false;
    for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig[i]) return false;
    }
    return true;
}

function checkHeicSignature(buffer) {
    if (!buffer || buffer.length < 12) return false;
    const ftyp = String.fromCharCode(...buffer.slice(4, 8));
    if (ftyp !== 'ftyp') return false;
    const brand = String.fromCharCode(...buffer.slice(8, 12));
    return ['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1'].includes(brand.toLowerCase());
}

/**
 * Validates files' binary signatures (magic bytes) to prevent extension spoofing
 */
function sanitizeUploadedFiles(files) {
    for (const file of files) {
        const ext = file.originalname.split('.').pop().toLowerCase();
        const buffer = file.buffer;

        if (!buffer || buffer.length === 0) {
            throw new Error(`File is empty: ${file.originalname}`);
        }

        let isValid = false;

        switch (ext) {
            case 'pdf':
                isValid = checkBufferSignature(buffer, SIGNATURES.pdf);
                break;
            case 'png':
                isValid = checkBufferSignature(buffer, SIGNATURES.png);
                break;
            case 'jpg':
            case 'jpeg':
                isValid = checkBufferSignature(buffer, SIGNATURES.jpg);
                break;
            case 'webp':
                isValid = checkBufferSignature(buffer, SIGNATURES.webp);
                break;
            case 'bmp':
                isValid = checkBufferSignature(buffer, SIGNATURES.bmp);
                break;
            case 'tiff':
            case 'tif':
                isValid = (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2A) ||
                          (buffer[0] === 0x4D && buffer[1] === 0x4D && buffer[2] === 0x2A);
                break;
            case 'heic':
            case 'heif':
                isValid = checkHeicSignature(buffer);
                break;
            default:
                isValid = true; // Permitted for undefined file streams, fallback to standard validators
        }

        if (!isValid) {
            throw new Error(`File signature mismatch for ${file.originalname}. The extension does not match its internal binary signature.`);
        }
    }
}

/**
 * Check PDF page count limits
 */
async function validatePdfPageCounts(files) {
    for (const file of files) {
        const ext = '.' + file.originalname.split('.').pop().toLowerCase();
        if (ext === '.pdf') {
            try {
                const pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
                const pageCount = pdfDoc.getPageCount();
                if (pageCount > MAX_PAGE_LIMIT) {
                    throw new Error(`PDF ${file.originalname} exceeds the maximum page limit of ${MAX_PAGE_LIMIT} pages (contains ${pageCount} pages).`);
                }
            } catch (err) {
                logger.warn(`Failed to read page count for PDF ${file.originalname}: ${err.message}`);
                // Don't crash immediately unless page count is specifically invalid
                if (err.message.includes('exceeds the maximum page limit')) {
                    throw err;
                }
            }
        }
    }
}

/**
 * Handle Multer limits and format clean JSON errors
 */
function handleMulterErrors(uploadMiddleware) {
    return (req, res, next) => {
        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return response.error(res, `File too large. Maximum size per file is 50MB.`, STATUS_CODES.BAD_REQUEST);
                }
                return response.error(res, `Upload limit error: ${err.message}`, STATUS_CODES.BAD_REQUEST);
            } else if (err) {
                return response.error(res, err.message, STATUS_CODES.INTERNAL_SERVER_ERROR);
            }
            next();
        });
    };
}

/**
 * High-level Upload Validation Pipeline Middleware
 */
const validateUpload = {
    uploadSingleImage: handleMulterErrors(upload.single('image')),
    uploadMultipleImages: handleMulterErrors(upload.array('images', MAX_FILE_COUNT)),
    uploadSinglePdf: handleMulterErrors(upload.single('pdf')),
    uploadMultiplePdfs: handleMulterErrors(upload.array('pdfs', MAX_FILE_COUNT)),
    uploadSingleDoc: handleMulterErrors(upload.single('file')),

    /**
     * Middleware validator for Image Upload arrays/elements
     */
    validateImageUploads: async (req, res, next) => {
        try {
            if (!req.files && !req.file) {
                return response.error(res, 'No image files uploaded', STATUS_CODES.BAD_REQUEST);
            }

            const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [req.file];
            if (files.length > MAX_FILE_COUNT) {
                return response.error(res, `Maximum file limit is ${MAX_FILE_COUNT} files`, STATUS_CODES.BAD_REQUEST);
            }

            // Standard extensions validation
            for (const file of files) {
                const ext = '.' + file.originalname.split('.').pop().toLowerCase();
                if (!ALLOWED_EXTENSIONS.IMAGES.includes(ext)) {
                    return response.error(res, `Invalid file type: ${file.originalname}. Only images are allowed (${ALLOWED_EXTENSIONS.IMAGES.join(', ')}).`, STATUS_CODES.BAD_REQUEST);
                }
            }

            // Spoofing detection
            sanitizeUploadedFiles(files);
            next();
        } catch (err) {
            return response.error(res, err.message, STATUS_CODES.BAD_REQUEST);
        }
    },

    /**
     * Middleware validator for PDF Upload arrays/elements
     */
    validatePdfUploads: async (req, res, next) => {
        try {
            if (!req.files && !req.file) {
                return response.error(res, 'No PDF files uploaded', STATUS_CODES.BAD_REQUEST);
            }

            const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [req.file];
            if (files.length > MAX_FILE_COUNT) {
                return response.error(res, `Maximum file limit is ${MAX_FILE_COUNT} files`, STATUS_CODES.BAD_REQUEST);
            }

            // Standard extensions validation
            for (const file of files) {
                const ext = '.' + file.originalname.split('.').pop().toLowerCase();
                if (!ALLOWED_EXTENSIONS.PDF.includes(ext)) {
                    return response.error(res, `Invalid file type: ${file.originalname}. Only PDF files (.pdf) are allowed.`, STATUS_CODES.BAD_REQUEST);
                }
            }

            // Spoofing check & PDF Page checking
            sanitizeUploadedFiles(files);
            await validatePdfPageCounts(files);
            next();
        } catch (err) {
            return response.error(res, err.message, STATUS_CODES.BAD_REQUEST);
        }
    },

    /**
     * Middleware validator for Office document uploads (Word, Excel, PowerPoint)
     */
    validateOfficeUploads: async (req, res, next) => {
        try {
            if (!req.file) {
                return response.error(res, 'No Office document file uploaded', STATUS_CODES.BAD_REQUEST);
            }

            const file = req.file;
            const ext = '.' + file.originalname.split('.').pop().toLowerCase();
            if (!ALLOWED_EXTENSIONS.OFFICE.includes(ext)) {
                return response.error(res, `Invalid file type: ${file.originalname}. Only Office documents (${ALLOWED_EXTENSIONS.OFFICE.join(', ')}) are allowed.`, STATUS_CODES.BAD_REQUEST);
            }

            // Perform binary/spoof checking where supported
            sanitizeUploadedFiles([file]);
            next();
        } catch (err) {
            return response.error(res, err.message, STATUS_CODES.BAD_REQUEST);
        }
    }
};

module.exports = validateUpload;
