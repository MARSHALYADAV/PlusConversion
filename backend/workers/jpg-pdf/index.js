const { PDFDocument } = require('pdf-lib');
const logger = require('../../utils/logger');

/**
 * Convert an array of image files with buffers into a single PDF document.
 * @param {Array<object>} imageFiles - Objects containing originalname and buffer
 * @returns {Promise<Buffer>} Consolidated PDF buffer
 */
async function imagesToPdf(imageFiles) {
    logger.info(`Starting JPG to PDF worker for ${imageFiles.length} images`);

    if (!imageFiles || imageFiles.length === 0) {
        throw new Error('No image files provided for PDF conversion');
    }

    const pdfDoc = await PDFDocument.create();

    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = file.originalname.split('.').pop().toLowerCase();
        let embeddedImage;

        try {
            if (ext === 'jpg' || ext === 'jpeg') {
                embeddedImage = await pdfDoc.embedJpg(file.buffer);
            } else if (ext === 'png') {
                embeddedImage = await pdfDoc.embedPng(file.buffer);
            } else {
                // If it is another format, use sharp to convert to a standard png buffer
                logger.info(`Converting non-standard image type (${ext}) to PNG buffer using Sharp at file index ${i}`);
                const sharp = require('sharp');
                const convertedBuffer = await sharp(file.buffer).png().toBuffer();
                embeddedImage = await pdfDoc.embedPng(convertedBuffer);
            }

            const { width, height } = embeddedImage.scale(1.0);
            const page = pdfDoc.addPage([width, height]);
            page.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: width,
                height: height
            });
        } catch (err) {
            logger.error(`Error processing image ${file.originalname} at index ${i}`, err);
            throw new Error(`Failed to process or embed image ${file.originalname}: ${err.message}`);
        }
    }

    const savedBytes = await pdfDoc.save();
    return Buffer.from(savedBytes);
}

module.exports = imagesToPdf;
