require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    MONGO_URI: process.env.MONGO_URI || null,
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLOUDINARY: {
        CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        API_KEY: process.env.CLOUDINARY_API_KEY,
        API_SECRET: process.env.CLOUDINARY_API_SECRET
    },
    // Standard limits
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    PAGE_LIMIT: 100, // Safe page limits
    TEMP_CLEANUP_MINUTES: 15
};
