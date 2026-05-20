const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const logger = require('../../utils/logger');

/**
 * Add page numbering (e.g., "Page X of Y") at the footer or header.
 * @param {Buffer} pdfBuffer
 * @param {object} options
 * @returns {Promise<Buffer>} Numbered PDF buffer
 */
async function addPageNumbers(pdfBuffer, options = {}) {
    logger.info('Starting PDF page numbering worker');

    if (!pdfBuffer) {
        throw new Error('No PDF buffer provided for page numbering');
    }

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const total = pages.length;
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const size = options.fontSize || 10;
    const position = options.position || 'bottom'; // 'top' or 'bottom'
    const formatStr = options.format || 'Page {num} of {total}';

    for (let i = 0; i < total; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const text = formatStr.replace('{num}', i + 1).replace('{total}', total);
        
        const x = width / 2 - (text.length * size * 0.25);
        const y = position === 'top' ? height - 30 : 30;

        page.drawText(text, {
            x: x,
            y: y,
            size: size,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5)
        });
    }

    const savedBytes = await pdfDoc.save();
    return Buffer.from(savedBytes);
}

module.exports = addPageNumbers;
