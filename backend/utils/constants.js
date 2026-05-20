const path = require('path');

module.exports = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50 MB
    MAX_PAGE_LIMIT: 100, // Maximum pages per PDF for processing
    TEMP_CLEANUP_MINUTES: 15,
    TEMP_UPLOADS_DIR: path.join(__dirname, '../../temp_uploads'),
    
    // File magic byte signatures
    MAGIC_BYTES: {
        PDF: '25504446',       // %PDF
        PNG: '89504e47',       // PNG header
        JPEG: 'ffd8ffe0',      // JPEG SOI header (also ffd8ffe1, ffd8ffe2, etc., we match prefix ffd8)
        JPEG_PREFIX: 'ffd8',
        GIF: '47494638',       // GIF8
        WEBP: '52494646',      // RIFF (WebP header contains WEBP at offset 8, but starts with RIFF)
        TIFF_II: '49492a00',   // TIFF Little Endian
        TIFF_MM: '4d4d002a',   // TIFF Big Endian
    },

    ALLOWED_EXTENSIONS: {
        PDF: ['.pdf'],
        IMAGES: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.heic']
    },

    STATUS_CODES: {
        OK: 200,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 411, // Standard limits or rate limit indicator
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500
    }
};
