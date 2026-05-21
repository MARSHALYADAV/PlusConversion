const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');
const response = require('../utils/response');
const { STATUS_CODES } = require('../utils/constants');

// General API rate limiter (protecting standard endpoints/previews)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.NODE_ENV === 'test' ? 10000 : 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
        return response.error(
            res, 
            'Too many requests from this IP. Please try again after 15 minutes.', 
            STATUS_CODES.TOO_MANY_REQUESTS
        );
    }
});

// Heavy operation rate limiter (protecting conversion, merge, split, compress routes)
const heavyOperationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.NODE_ENV === 'test' ? 10000 : 15, // Limit each IP to 15 heavy conversion jobs per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Heavy operation rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
        return response.error(
            res, 
            'Heavy processing rate limit exceeded. Please limit uploads to 15 jobs per 15 minutes.', 
            STATUS_CODES.TOO_MANY_REQUESTS
        );
    }
});

module.exports = {
    generalLimiter,
    heavyOperationLimiter
};
