const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const pdfValidator = require('../validators/pdfValidator');
const validateUpload = require('../../middleware/validateUpload');
const { heavyOperationLimiter } = require('../../middleware/rateLimiter');

/**
 * PDF Merge Route
 */
router.post(
    '/merge',
    heavyOperationLimiter,
    validateUpload.uploadMultiplePdfs,
    validateUpload.validatePdfUploads,
    pdfController.merge
);

/**
 * PDF Split Route
 */
router.post(
    '/split',
    heavyOperationLimiter,
    validateUpload.uploadSinglePdf,
    validateUpload.validatePdfUploads,
    pdfValidator.validateSplit,
    pdfController.split
);

/**
 * PDF Rotate Route
 */
router.post(
    '/rotate',
    heavyOperationLimiter,
    validateUpload.uploadSinglePdf,
    validateUpload.validatePdfUploads,
    pdfValidator.validateRotate,
    pdfController.rotate
);

/**
 * PDF Watermark Route
 */
router.post(
    '/watermark',
    heavyOperationLimiter,
    validateUpload.uploadSinglePdf,
    validateUpload.validatePdfUploads,
    pdfValidator.validateWatermark,
    pdfController.watermark
);

/**
 * PDF Add Page Numbers Route
 */
router.post(
    '/page-number',
    heavyOperationLimiter,
    validateUpload.uploadSinglePdf,
    validateUpload.validatePdfUploads,
    pdfValidator.validateNumbering,
    pdfController.addPageNumbers
);

/**
 * PDF Compression Route
 */
router.post(
    '/compress',
    heavyOperationLimiter,
    validateUpload.uploadSinglePdf,
    validateUpload.validatePdfUploads,
    pdfController.compress
);

/**
 * JPG / PNG Images compiled to PDF
 */
router.post(
    '/images-to-pdf',
    heavyOperationLimiter,
    validateUpload.uploadMultipleImages,
    validateUpload.validateImageUploads,
    pdfController.imagesToPdf
);

module.exports = router;
