const { STATUS_CODES } = require('./constants');

/**
 * Standard API response helper functions
 */
const response = {
    /**
     * Send a successful JSON response
     */
    success: (res, data = {}, statusCode = STATUS_CODES.OK) => {
        return res.status(statusCode).json({
            success: true,
            ...data
        });
    },

    /**
     * Send an error JSON response
     */
    error: (res, message = 'An error occurred', statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR, details = null) => {
        const errorBody = {
            success: false,
            error: message
        };
        if (details) {
            errorBody.details = details;
        }
        return res.status(statusCode).json(errorBody);
    }
};

module.exports = response;
