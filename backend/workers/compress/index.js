const { PDFDocument } = require('pdf-lib');
const logger = require('../../utils/logger');

/**
 * Compress a PDF by re-saving it with object streams compressed.
 * @param {Buffer} pdfBuffer
 * @returns {Promise<Buffer>} Compressed PDF buffer
 */
async function compressPdf(pdfBuffer) {
    logger.info('Starting PDF compress worker');

    if (!pdfBuffer) {
        throw new Error('No PDF buffer provided for compression');
    }

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Resave with compression optimization flags active
    const savedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addGlyphMapGroups: false
    });

    return Buffer.from(savedBytes);
}

module.exports = compressPdf;
