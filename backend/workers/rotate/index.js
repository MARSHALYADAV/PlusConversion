const { PDFDocument, degrees } = require('pdf-lib');
const logger = require('../../utils/logger');

/**
 * Rotate pages of a PDF by 90, 180, or 270 degrees.
 * @param {Buffer} pdfBuffer
 * @param {number} angleDegree - e.g. 90, 180, 270
 * @returns {Promise<Buffer>} Rotated PDF buffer
 */
async function rotatePdf(pdfBuffer, angleDegree = 90) {
    logger.info(`Starting PDF rotate worker with angle: ${angleDegree}`);

    if (!pdfBuffer) {
        throw new Error('No PDF buffer provided for rotation');
    }

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const rotAngle = degrees(parseInt(angleDegree) || 90);

    for (const page of pages) {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + rotAngle.angle));
    }

    const savedBytes = await pdfDoc.save();
    return Buffer.from(savedBytes);
}

module.exports = rotatePdf;
