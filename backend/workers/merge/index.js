const { PDFDocument } = require('pdf-lib');
const logger = require('../../utils/logger');

/**
 * Merge multiple PDF buffers in the specified order.
 * @param {Array<Buffer>} pdfBuffers
 * @returns {Promise<Buffer>} Merged PDF buffer
 */
async function mergePdfs(pdfBuffers) {
    logger.info(`Starting PDF merge worker for ${pdfBuffers.length} buffers`);
    
    if (!pdfBuffers || pdfBuffers.length === 0) {
        throw new Error('No PDF buffers provided for merging');
    }

    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < pdfBuffers.length; i++) {
        try {
            const pdfDoc = await PDFDocument.load(pdfBuffers[i]);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        } catch (err) {
            logger.error(`Error adding PDF buffer at index ${i} to merge`, err);
            throw new Error(`Failed to load or parse PDF at file index ${i + 1}: ${err.message}`);
        }
    }

    const savedBytes = await mergedPdf.save();
    return Buffer.from(savedBytes);
}

module.exports = mergePdfs;
