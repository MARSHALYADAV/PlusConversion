const mergePdfs = require('../../workers/merge');
const splitPdf = require('../../workers/split');
const rotatePdf = require('../../workers/rotate');
const watermarkPdf = require('../../workers/watermark');
const addPageNumbers = require('../../workers/numbering');
const compressPdf = require('../../workers/compress');
const imagesToPdf = require('../../workers/jpg-pdf');

class PdfService {
    /**
     * Dispatch Merge operation to the Merge Worker
     */
    static async merge(pdfBuffers) {
        return await mergePdfs(pdfBuffers);
    }

    /**
     * Dispatch Split operation to the Split Worker
     */
    static async split(pdfBuffer, pageRangeStr) {
        return await splitPdf(pdfBuffer, pageRangeStr);
    }

    /**
     * Dispatch Rotate operation to the Rotate Worker
     */
    static async rotate(pdfBuffer, angleDegree) {
        return await rotatePdf(pdfBuffer, angleDegree);
    }

    /**
     * Dispatch Watermark operation to the Watermark Worker
     */
    static async watermark(pdfBuffer, text, options) {
        return await watermarkPdf(pdfBuffer, text, options);
    }

    /**
     * Dispatch Page Numbering operation to the Numbering Worker
     */
    static async addPageNumbers(pdfBuffer, options) {
        return await addPageNumbers(pdfBuffer, options);
    }

    /**
     * Dispatch PDF compression operation to the Compress Worker
     */
    static async compress(pdfBuffer, mode = 'recommended') {
        return await compressPdf(pdfBuffer, mode);
    }

    /**
     * Dispatch Image Conversion operation to the ImagesToPdf Worker
     */
    static async imagesToPdf(imageFiles) {
        return await imagesToPdf(imageFiles);
    }
}

module.exports = PdfService;
