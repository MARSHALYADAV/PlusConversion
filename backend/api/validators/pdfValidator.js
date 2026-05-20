const response = require('../../utils/response');
const { STATUS_CODES } = require('../../utils/constants');

const pdfValidator = {
    /**
     * Validate split PDF request payload
     */
    validateSplit: (req, res, next) => {
        const { pageRange } = req.body;
        if (pageRange && typeof pageRange !== 'string') {
            return response.error(res, 'pageRange must be a string containing comma-separated numbers (e.g. "1,2,5")', STATUS_CODES.BAD_REQUEST);
        }
        if (pageRange) {
            const isValid = pageRange.split(',').every(num => !isNaN(parseInt(num.trim())));
            if (!isValid) {
                return response.error(res, 'pageRange must contain only valid numbers separated by commas', STATUS_CODES.BAD_REQUEST);
            }
        }
        next();
    },

    /**
     * Validate rotation angles
     */
    validateRotate: (req, res, next) => {
        const angle = parseInt(req.body.angle);
        if (isNaN(angle)) {
            return response.error(res, 'Rotation angle must be a valid integer', STATUS_CODES.BAD_REQUEST);
        }
        if (![90, 180, 270, 360].includes(angle)) {
            return response.error(res, 'Rotation angle must be 90, 180, 270, or 360 degrees', STATUS_CODES.BAD_REQUEST);
        }
        next();
    },

    /**
     * Validate watermark settings
     */
    validateWatermark: (req, res, next) => {
        const { text, size, color, opacity, rotation } = req.body;
        
        if (!text || typeof text !== 'string') {
            return response.error(res, 'Watermark text is required and must be a string', STATUS_CODES.BAD_REQUEST);
        }

        if (size && isNaN(parseInt(size))) {
            return response.error(res, 'Watermark font size must be a number', STATUS_CODES.BAD_REQUEST);
        }

        if (opacity && (isNaN(parseFloat(opacity)) || parseFloat(opacity) < 0 || parseFloat(opacity) > 1)) {
            return response.error(res, 'Watermark opacity must be a decimal between 0 and 1', STATUS_CODES.BAD_REQUEST);
        }

        if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
            return response.error(res, 'Watermark color must be a valid Hex string (e.g. #FF0000)', STATUS_CODES.BAD_REQUEST);
        }

        if (rotation && isNaN(parseInt(rotation))) {
            return response.error(res, 'Watermark rotation must be an integer degree', STATUS_CODES.BAD_REQUEST);
        }

        next();
    },

    /**
     * Validate page numbering configurations
     */
    validateNumbering: (req, res, next) => {
        const { position, fontSize, format } = req.body;

        if (position && !['top', 'bottom'].includes(position.toLowerCase())) {
            return response.error(res, 'Page number position must be "top" or "bottom"', STATUS_CODES.BAD_REQUEST);
        }

        if (fontSize && isNaN(parseInt(fontSize))) {
            return response.error(res, 'Page number fontSize must be a number', STATUS_CODES.BAD_REQUEST);
        }

        if (format && typeof format !== 'string') {
            return response.error(res, 'Page number format must be a template string', STATUS_CODES.BAD_REQUEST);
        }

        next();
    }
};

module.exports = pdfValidator;
