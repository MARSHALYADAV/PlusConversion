const config = require('../config');

const logger = {
    info: (message, ...meta) => {
        if (config.NODE_ENV !== 'test') {
            console.log(`[INFO] ${new Date().toISOString()}: ${message}`, ...meta);
        }
    },
    warn: (message, ...meta) => {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, ...meta);
    },
    error: (message, error) => {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
        if (error && error.stack) {
            console.error(error.stack);
        } else if (error) {
            console.error(error);
        }
    },
    debug: (message, ...meta) => {
        if (config.NODE_ENV === 'development') {
            console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, ...meta);
        }
    }
};

module.exports = logger;
