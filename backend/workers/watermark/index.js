const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');
const logger = require('../../utils/logger');

/**
 * Overlay text watermark on PDF pages.
 * @param {Buffer} pdfBuffer
 * @param {string} text
 * @param {object} options
 * @returns {Promise<Buffer>} Watermarked PDF buffer
 */
async function watermarkPdf(pdfBuffer, text, options = {}) {
    logger.info(`Starting PDF watermark worker with text: "${text}"`);

    if (!pdfBuffer) {
        throw new Error('No PDF buffer provided for watermarking');
    }

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const size = options.size || 50;
    const colorHex = options.color || '#cccccc';
    const opacity = options.opacity !== undefined ? parseFloat(options.opacity) : 0.4;
    const rotationAngle = options.rotation !== undefined ? parseInt(options.rotation) : -45;

    // Parse hex color to rgb
    let r = 0.8, g = 0.8, b = 0.8;
    try {
        const cleanedHex = colorHex.replace('#', '');
        r = parseInt(cleanedHex.slice(0, 2), 16) / 255 || 0.8;
        g = parseInt(cleanedHex.slice(2, 4), 16) / 255 || 0.8;
        b = parseInt(cleanedHex.slice(4, 6), 16) / 255 || 0.8;
    } catch (err) {
        logger.warn(`Failed parsing hex color "${colorHex}", falling back to gray.`);
    }

    for (const page of pages) {
        const { width, height } = page.getSize();
        page.drawText(text, {
            x: width / 2 - (text.length * size * 0.3),
            y: height / 2,
            size: size,
            font: helveticaFont,
            color: rgb(r, g, b),
            opacity: opacity,
            rotate: degrees(rotationAngle),
            originAtCenter: true
        });
    }

    const savedBytes = await pdfDoc.save();
    return Buffer.from(savedBytes);
}

module.exports = watermarkPdf;
