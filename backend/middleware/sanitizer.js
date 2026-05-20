/**
 * Request and File Sanitization Middleware.
 * Inspects file buffers' magic numbers to protect against extension spoofing
 * and malformed file uploads.
 */

// Magic numbers hex signatures
const SIGNATURES = {
    pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
    png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    jpg: [0xFF, 0xD8, 0xFF],
    webp: [0x52, 0x49, 0x46, 0x46], // "RIFF" (WebP has WEBP at offset 8, but starts with RIFF)
    bmp: [0x42, 0x4D] // BM
};

function checkBufferSignature(buffer, sig) {
    if (buffer.length < sig.length) return false;
    for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig[i]) return false;
    }
    return true;
}

function checkHeicSignature(buffer) {
    // HEIC files typically start with ftyp at offset 4
    if (buffer.length < 12) return false;
    const ftyp = String.fromCharCode(...buffer.slice(4, 8));
    if (ftyp !== 'ftyp') return false;
    const brand = String.fromCharCode(...buffer.slice(8, 12));
    return ['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1'].includes(brand.toLowerCase());
}

function sanitizeUploadedFiles(req, res, next) {
    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : (req.file ? [req.file] : []);

    for (const file of files) {
        const ext = file.originalname.split('.').pop().toLowerCase();
        const buffer = file.buffer;

        if (!buffer || buffer.length === 0) {
            return res.status(400).json({ success: false, error: `File is empty: ${file.originalname}` });
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
                // TIFF can be II* (49 49 2A 00) or MM* (4D 4D 00 2A)
                isValid = (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2A) ||
                          (buffer[0] === 0x4D && buffer[1] === 0x4D && buffer[2] === 0x2A);
                break;
            case 'heic':
            case 'heif':
                isValid = checkHeicSignature(buffer);
                break;
            default:
                isValid = true; // For other files not explicitly checked yet
        }

        if (!isValid) {
            return res.status(400).json({
                success: false,
                error: `File signature mismatch for ${file.originalname}. The file extension does not match its internal binary format or the file is corrupted.`
            });
        }
    }

    next();
}

module.exports = {
    sanitizeUploadedFiles
};
