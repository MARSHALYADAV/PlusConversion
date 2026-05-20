/**
 * Unified Config Manager.
 * Loads and exposes configuration values cleanly with defaults.
 */

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    
    // DB setup
    mongoUri: process.env.MONGO_URI || null,
    
    // Cloudinary setup
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
        apiKey: process.env.CLOUDINARY_API_KEY || null,
        apiSecret: process.env.CLOUDINARY_API_SECRET || null
    },

    // Standard business rules
    limits: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10,
        tempExpiryMs: 15 * 60 * 1000 // 15 minutes
    }
};

module.exports = config;
