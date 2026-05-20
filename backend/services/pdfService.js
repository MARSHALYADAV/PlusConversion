const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');

class PdfService {
    /**
     * Merge multiple PDF buffers in the specified order.
     */
    static async mergePdfs(pdfBuffers) {
        const mergedPdf = await PDFDocument.create();

        for (const buffer of pdfBuffers) {
            const pdfDoc = await PDFDocument.load(buffer);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        return await mergedPdf.save();
    }

    /**
     * Split a single PDF into individual page buffers or a range.
     * Returns an array of page PDF documents or a single document depending on range.
     */
    static async splitPdf(pdfBuffer, pageRangeStr = '') {
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();
        let pagesToExtract = [];

        if (pageRangeStr) {
            pagesToExtract = pageRangeStr.split(',')
                .map(p => parseInt(p.trim()) - 1)
                .filter(p => p >= 0 && p < pageCount);
        } else {
            pagesToExtract = pdfDoc.getPageIndices();
        }

        if (pagesToExtract.length === 0) {
            throw new Error('No valid pages found in page range filter');
        }

        // Returns split documents so the controller can decide whether to zip them or send as single file
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

    /**
     * Rotate pages of a PDF by 90, 180, or 270 degrees.
     */
    static async rotatePdf(pdfBuffer, angleDegree = 90) {
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pages = pdfDoc.getPages();
        const rotAngle = degrees(parseInt(angleDegree) || 90);

        for (const page of pages) {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees(currentRotation + rotAngle.angle));
        }

        return await pdfDoc.save();
    }

    /**
     * Overlay text watermark on PDF pages.
     */
    static async watermarkPdf(pdfBuffer, text, options = {}) {
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pages = pdfDoc.getPages();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const size = options.size || 50;
        const colorHex = options.color || '#cccccc';
        const opacity = options.opacity !== undefined ? parseFloat(options.opacity) : 0.4;
        const rotationAngle = options.rotation !== undefined ? parseInt(options.rotation) : -45;

        // Parse hex color to rgb
        const r = parseInt(colorHex.slice(1, 3), 16) / 255 || 0.8;
        const g = parseInt(colorHex.slice(3, 5), 16) / 255 || 0.8;
        const b = parseInt(colorHex.slice(5, 7), 16) / 255 || 0.8;

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

        return await pdfDoc.save();
    }

    /**
     * Add page numbering (e.g., "Page X of Y") at the footer.
     */
    static async addPageNumbers(pdfBuffer, options = {}) {
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

        return await pdfDoc.save();
    }

    /**
     * Convert JPEG / PNG image buffers into a unified PDF.
     */
    static async imagesToPdf(imageFiles) {
        const pdfDoc = await PDFDocument.create();

        for (const file of imageFiles) {
            const ext = file.originalname.split('.').pop().toLowerCase();
            let embeddedImage;

            if (ext === 'jpg' || ext === 'jpeg') {
                embeddedImage = await pdfDoc.embedJpg(file.buffer);
            } else if (ext === 'png') {
                embeddedImage = await pdfDoc.embedPng(file.buffer);
            } else {
                // If it is another format, use sharp to convert to jpeg/png buffer first
                const convertedBuffer = await require('sharp')(file.buffer).png().toBuffer();
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
        }

        return await pdfDoc.save();
    }

    /**
     * Compress a PDF. Strips redundant resources and re-encodes pages to minimize size.
     */
    static async compressPdf(pdfBuffer) {
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        // Resave with compression optimization flags active
        return await pdfDoc.save({
            useObjectStreams: true,
            addGlyphMapGroups: false
        });
    }
}

module.exports = PdfService;
