const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');
const logger = require('../../utils/logger');

/**
 * Overlay annotations (text, drawings, shapes, images) onto PDF pages.
 * @param {Buffer} pdfBuffer - Input PDF buffer
 * @param {Array} annotations - Array of annotation objects
 * @returns {Promise<Buffer>} Edited PDF buffer
 */
async function editPdf(pdfBuffer, annotations = []) {
    logger.info(`Starting PDF edit worker with ${annotations.length} annotations`);

    if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('No PDF buffer provided');
    }

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Helper to convert hex color to RGB object
    function hexToRgb(hex) {
        if (!hex || hex.length < 7) return rgb(0, 0, 0); // fallback black
        const r = parseInt(hex.slice(1, 3), 16) / 255 || 0;
        const g = parseInt(hex.slice(3, 5), 16) / 255 || 0;
        const b = parseInt(hex.slice(5, 7), 16) / 255 || 0;
        return rgb(r, g, b);
    }

    for (const ann of annotations) {
        const pageIdx = parseInt(ann.pageIndex);
        if (isNaN(pageIdx) || pageIdx < 0 || pageIdx >= pages.length) {
            logger.warn(`Skipping annotation: Invalid page index ${pageIdx}`);
            continue;
        }

        const page = pages[pageIdx];

        try {
            switch (ann.type) {
                case 'text': {
                    const text = ann.text || '';
                    const x = parseFloat(ann.x) || 0;
                    const y = parseFloat(ann.y) || 0;
                    const fontSize = parseFloat(ann.fontSize) || 12;
                    const color = hexToRgb(ann.color);
                    
                    page.drawText(text, {
                        x: x,
                        y: y,
                        size: fontSize,
                        font: helveticaFont,
                        color: color,
                        opacity: isNaN(parseFloat(ann.opacity)) ? 1.0 : parseFloat(ann.opacity)
                    });
                    break;
                }

                case 'drawing': {
                    const points = ann.points || [];
                    if (points.length < 2) continue;

                    const color = hexToRgb(ann.color);
                    const thickness = parseFloat(ann.thickness) || 2;
                    const opacity = isNaN(parseFloat(ann.opacity)) ? 1.0 : parseFloat(ann.opacity);

                    for (let i = 0; i < points.length - 1; i++) {
                        const start = points[i];
                        const end = points[i + 1];
                        page.drawLine({
                            start: { x: parseFloat(start.x), y: parseFloat(start.y) },
                            end: { x: parseFloat(end.x), y: parseFloat(end.y) },
                            thickness: thickness,
                            color: color,
                            opacity: opacity
                        });
                    }
                    break;
                }

                case 'shape': {
                    const x = parseFloat(ann.x) || 0;
                    const y = parseFloat(ann.y) || 0;
                    const width = parseFloat(ann.width) || 50;
                    const height = parseFloat(ann.height) || 50;
                    const color = hexToRgb(ann.color);
                    const opacity = isNaN(parseFloat(ann.opacity)) ? 1.0 : parseFloat(ann.opacity);
                    const fill = ann.fill !== false;

                    if (ann.shapeType === 'circle') {
                        // pdf-lib drawCircle draws around coordinate center
                        page.drawCircle({
                            x: x + width / 2,
                            y: y + height / 2,
                            size: width / 2,
                            color: fill ? color : undefined,
                            borderColor: !fill ? color : undefined,
                            borderWidth: !fill ? 2 : undefined,
                            opacity: opacity
                        });
                    } else {
                        page.drawRectangle({
                            x: x,
                            y: y,
                            width: width,
                            height: height,
                            color: fill ? color : undefined,
                            borderColor: !fill ? color : undefined,
                            borderWidth: !fill ? 2 : undefined,
                            opacity: opacity
                        });
                    }
                    break;
                }

                case 'image': {
                    const base64 = ann.base64 || '';
                    if (!base64) continue;

                    const x = parseFloat(ann.x) || 0;
                    const y = parseFloat(ann.y) || 0;
                    const width = parseFloat(ann.width) || 100;
                    const height = parseFloat(ann.height) || 100;

                    // Parse base64 header
                    const matches = base64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                    if (!matches) continue;

                    const mimeType = matches[1];
                    const rawData = Buffer.from(matches[2], 'base64');
                    
                    let embeddedImage;
                    if (mimeType.includes('png')) {
                        embeddedImage = await pdfDoc.embedPng(rawData);
                    } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
                        embeddedImage = await pdfDoc.embedJpg(rawData);
                    } else {
                        // Convert formats like WebP or GIF to PNG buffer using sharp
                        const converted = await require('sharp')(rawData).png().toBuffer();
                        embeddedImage = await pdfDoc.embedPng(converted);
                    }

                    page.drawImage(embeddedImage, {
                        x: x,
                        y: y,
                        width: width,
                        height: height
                    });
                    break;
                }

                default:
                    logger.warn(`Unknown annotation type: ${ann.type}`);
            }
        } catch (err) {
            logger.error(`Error applying annotation of type ${ann.type} on page ${pageIdx}: ${err.message}`);
        }
    }

    const savedBytes = await pdfDoc.save();
    return Buffer.from(savedBytes);
}

module.exports = editPdf;
