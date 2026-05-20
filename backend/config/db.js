const mongoose = require('mongoose');
const config = require('./index');

async function connectDB() {
    if (!config.MONGO_URI) {
        console.log('No MONGO_URI environment variable detected. Running in transient disk mode.');
        return null;
    }

    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('Database connected successfully.');
        return mongoose.connection;
    } catch (err) {
        console.error('Database connection failure:', err.message);
        // Fall back gracefully instead of crashing in production
        return null;
    }
}

module.exports = connectDB;
