const config = require('../config');

/**
 * Structured logger that outputs consistent JSON-like strings
 * for easy ingestion by logging platforms (CloudWatch, Datadog, etc).
 */
const formatLog = (level, message, meta = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta
    };
    return JSON.stringify(entry);
};

const logger = {
    info: (message, meta = {}) => {
        if (config.NODE_ENV !== 'test') {
            console.log(formatLog('INFO', message, meta));
        }
    },
    warn: (message, meta = {}) => {
        console.warn(formatLog('WARN', message, meta));
    },
    error: (message, error = null, meta = {}) => {
        const errMeta = error ? {
            errorName: error.name,
            errorMessage: error.message,
            stack: error.stack
        } : {};
        console.error(formatLog('ERROR', message, { ...meta, ...errMeta }));
    },
    debug: (message, meta = {}) => {
        if (config.NODE_ENV === 'development') {
            console.log(formatLog('DEBUG', message, meta));
        }
    }
};

module.exports = logger;
