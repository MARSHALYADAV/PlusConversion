const multer = require('multer');

// Configure limits
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILE_COUNT = 10;

// Setup in-memory storage for rapid ephemeral processing
const storage = multer.memoryStorage();

// Allowed file extensions
const ALLOWED_IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.bmp', '.heic', '.heif'];
const ALLOWED_PDF_EXTS = ['.pdf'];

// Create the core upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
});

// Validator middleware to check if files actually exist and validate their attributes
function validateImageUploads(req, res, next) {
    if (!req.files && !req.file) {
        return res.status(400).json({ success: false, error: 'No image files uploaded' });
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [req.file];
    
    if (files.length > MAX_FILE_COUNT) {
        return res.status(400).json({ success: false, error: `Maximum file limit is ${MAX_FILE_COUNT} files` });
    }

    for (const file of files) {
        const ext = '.' + file.originalname.split('.').pop().toLowerCase();
        if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid file type: ${file.originalname}. Only images are allowed (${ALLOWED_IMAGE_EXTS.join(', ')}).` 
            });
        }
    }
    next();
}

function validatePdfUploads(req, res, next) {
    if (!req.files && !req.file) {
        return res.status(400).json({ success: false, error: 'No PDF files uploaded' });
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [req.file];

    if (files.length > MAX_FILE_COUNT) {
        return res.status(400).json({ success: false, error: `Maximum file limit is ${MAX_FILE_COUNT} files` });
    }

    for (const file of files) {
        const ext = '.' + file.originalname.split('.').pop().toLowerCase();
        if (!ALLOWED_PDF_EXTS.includes(ext)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid file type: ${file.originalname}. Only PDF files (.pdf) are allowed.` 
            });
        }
    }
    next();
}

// Multer error handling wrapper to output clean JSON messages on file limit errors
function handleMulterErrors(uploadMiddleware) {
    return (req, res, next) => {
        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ 
                        success: false, 
                        error: `File is too large. The maximum size allowed per file is 50MB.` 
                    });
                }
                return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
            } else if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }
            next();
        });
    };
}

module.exports = {
    uploadSingleImage: handleMulterErrors(upload.single('image')),
    uploadMultipleImages: handleMulterErrors(upload.array('images', MAX_FILE_COUNT)),
    uploadSinglePdf: handleMulterErrors(upload.single('pdf')),
    uploadMultiplePdfs: handleMulterErrors(upload.array('pdfs', MAX_FILE_COUNT)),
    validateImageUploads,
    validatePdfUploads
};
