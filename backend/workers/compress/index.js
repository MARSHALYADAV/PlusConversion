const { PDFDocument } = require('pdf-lib');
const logger = require('../../utils/logger');

/**
 * Compress a PDF by re-saving it with object streams compressed.
 * @param {Buffer} pdfBuffer
 * @param {string} mode - 'low' | 'recommended' | 'extreme'
 * @returns {Promise<Buffer>} Compressed PDF buffer
 */
async function compressPdf(pdfBuffer, mode = 'recommended') {
    logger.info(`Starting PDF compress worker in ${mode} mode`);

    if (!pdfBuffer) {
        throw new Error('No PDF buffer provided for compression');
    }

    const pdfDoc = await PDFDocument.load(pdfBuffer, {
        ignoreEncryption: true, // Attempt to load if encrypted with empty password
    });

    let saveOptions = {
        useObjectStreams: true,
        addGlyphMapGroups: false
    };

    if (mode === 'extreme') {
        // Strip out all metadata, outlines, and structural hints
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');
    } else if (mode === 'low') {
        // Preserve structure
        saveOptions.useObjectStreams = false;
    }

    const savedBytes = await pdfDoc.save(saveOptions);
    return Buffer.from(savedBytes);
}

module.exports = compressPdf;
