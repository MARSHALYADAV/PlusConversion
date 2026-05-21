const logger = require('../../utils/logger');

class OcrService {
    static async processPdf(pdfBuffer) {
        logger.info('OCR Service: Extracting text from PDF (Placeholder)');
        throw new Error('OCR is currently in development.');
    }
}

module.exports = OcrService;
