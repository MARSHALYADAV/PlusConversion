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

    const statusCode = err.status || err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    
    // In production, avoid leaking full error stack details
    const message = statusCode === STATUS_CODES.INTERNAL_SERVER_ERROR && config.NODE_ENV === 'production'
        ? 'An unexpected error occurred on our server.'
        : err.message || 'Internal Server Error';

    const details = config.NODE_ENV !== 'production' ? { stack: err.stack } : null;

    return response.error(res, message, statusCode, details);
}

module.exports = errorHandler;
