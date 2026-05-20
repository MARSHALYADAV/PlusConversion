const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const imageValidator = require('../validators/imageValidator');
const validateUpload = require('../../middleware/validateUpload');
const { generalLimiter, heavyOperationLimiter } = require('../../middleware/rateLimiter');

/**
 * Snappy Image Previews
 */
router.post(
    '/preview',
    generalLimiter,
    validateUpload.uploadSingleImage,
    validateUpload.validateImageUploads,
    imageController.preview
);

/**
 * Standard / Heavy Image Conversions
 */
router.post(
    '/convert',
    heavyOperationLimiter,
    validateUpload.uploadMultipleImages,
    validateUpload.validateImageUploads,
    imageValidator.validateConvert,
    imageController.convert
);

module.exports = router;
