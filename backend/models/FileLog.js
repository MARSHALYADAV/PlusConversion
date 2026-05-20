const mongoose = require('mongoose');

const FileLogSchema = new mongoose.Schema({
    storageId: {
        type: String,
        required: true,
        unique: true
    },
    storageType: {
        type: String,
        enum: ['local', 'cloudinary'],
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Let MongoDB's TTL index clean the log records automatically
    }
});

// Avoid model re-definition compile errors in server restarts
module.exports = mongoose.models.FileLog || mongoose.model('FileLog', FileLogSchema);
