const logger = require('../utils/logger');
const response = require('../utils/response');
const { STATUS_CODES } = require('../utils/constants');
const config = require('../config');

/**
 * Centralized Error Handling Middleware for Express.
 * Catches all unhandled controller/service exceptions and returns consistent JSON.
 */
function errorHandler(err, req, res, next) {
    logger.error(`Unhandled exception in route: ${req.method} ${req.originalUrl}`, err);

    // Handle Multer upload errors
    if (err.name === 'MulterError') {
        let msg = err.message;
        if (err.code === 'LIMIT_FILE_SIZE') msg = 'File size limit exceeded.';
        if (err.code === 'LIMIT_UNEXPECTED_FILE') msg = 'Too many files uploaded.';
        return response.error(res, `Upload Error: ${msg}`, STATUS_CODES.PAYLOAD_TOO_LARGE);
    }

    // Handle generic payload too large errors from body-parser/express
    if (err.type === 'entity.too.large') {
        return response.error(res, 'Request payload too large.', STATUS_CODES.PAYLOAD_TOO_LARGE);
    }

    // Handle Timeouts
    if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
        return response.error(res, 'The operation took too long and was aborted.', 408);
    }

    const statusCode = err.status || err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    
    // In production, avoid leaking full error stack details
    const message = statusCode === STATUS_CODES.INTERNAL_SERVER_ERROR && config.NODE_ENV === 'production'
        ? 'An unexpected error occurred on our server.'
        : err.message || 'Internal Server Error';

    const details = config.NODE_ENV !== 'production' ? { stack: err.stack } : null;

    return response.error(res, message, statusCode, details);
}

module.exports = errorHandler;
