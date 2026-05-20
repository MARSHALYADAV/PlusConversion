const { PDFDocument } = require('pdf-lib');
const logger = require('../../utils/logger');

/**
 * Split a single PDF into individual page buffers or a range.
 * @param {Buffer} pdfBuffer
 * @param {string} pageRangeStr - E.g. "1,2,5" or blank for all pages
 * @returns {Promise<Array<{pageIndex: number, buffer: Buffer}>>}
 */
async function splitPdf(pdfBuffer, pageRangeStr = '') {
    logger.info(`Starting PDF split worker (range: "${pageRangeStr || 'all'}")`);

    if (!pdfBuffer) {
        throw new Error('No PDF buffer provided for splitting');
    }

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    let pagesToExtract = [];

    if (pageRangeStr && pageRangeStr.trim()) {
        pagesToExtract = pageRangeStr.split(',')
            .map(p => parseInt(p.trim()) - 1)
            .filter(p => p >= 0 && p < pageCount);
    } else {
        pagesToExtract = pdfDoc.getPageIndices();
    }

    if (pagesToExtract.length === 0) {
        throw new Error('No valid pages found in page range filter');
    }

    const splitFiles = [];
    for (const pageIdx of pagesToExtract) {
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, [pageIdx]);
        newPdf.addPage(copiedPages[0]);
        const bytes = await newPdf.save();
        
        splitFiles.push({
            pageIndex: pageIdx + 1,
            buffer: Buffer.from(bytes)
        });
    }

    return splitFiles;
}

module.exports = splitPdf;
