const cors = require('cors');
const helmet = require('helmet');

/**
 * Configure Helmet with robust but lenient default settings
 * to ensure that CDN-hosted client scripts and styling work smoothly.
 */
const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "https://api.cloudinary.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
});

/**
 * Configure CORS to allow localized and production host requests securely.
 */
const corsMiddleware = cors({
    origin: '*', // For an anonymous open conversion utility, allow all origins or restrict as needed
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
});

module.exports = {
    helmetMiddleware,
    corsMiddleware
};
