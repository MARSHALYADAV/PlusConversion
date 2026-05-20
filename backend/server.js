const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');
const CleanupService = require('./services/cleanup');
const logger = require('./utils/logger');

async function bootstrap() {
    // 1. Establish database connection
    await connectDB();

    // 2. Start temporary file automatic purge worker (runs every 60 seconds)
    CleanupService.start();

    // 3. Start listener
    const server = app.listen(config.PORT, () => {
        logger.info(`PlusConversion platform listening on port ${config.PORT} [env: ${config.NODE_ENV}]`);
    });

    // Support graceful shutdown
    const handleShutdown = (signal) => {
        logger.info(`Received ${signal}. Shutting down gracefully...`);
        server.close(() => {
            logger.info('HTTP server closed.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
}

bootstrap().catch(err => {
    logger.error('Failed bootstrapping application', err);
    process.exit(1);
});

module.exports = app; // For automated API test suites to import
