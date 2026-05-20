const response = require('../../utils/response');
const { STATUS_CODES } = require('../../utils/constants');

const imageValidator = {
    /**
     * Validate convert image request parameters
     */
    validateConvert: (req, res, next) => {
        const { format, quality, targetSize } = req.body;

        if (format && !['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'].includes(format.toLowerCase())) {
            return response.error(res, 'Target format must be jpg, png, webp, bmp, or tiff', STATUS_CODES.BAD_REQUEST);
        }

        if (quality && (isNaN(parseInt(quality)) || parseInt(quality) < 1 || parseInt(quality) > 100)) {
            return response.error(res, 'Quality parameter must be an integer between 1 and 100', STATUS_CODES.BAD_REQUEST);
        }

        if (targetSize && isNaN(parseFloat(targetSize))) {
            return response.error(res, 'Target size must be a number specifying megabytes', STATUS_CODES.BAD_REQUEST);
        }

        next();
    }
};

module.exports = imageValidator;
