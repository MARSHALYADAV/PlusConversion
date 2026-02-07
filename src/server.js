const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// API Endpoint for image conversion
app.post('/api/convert', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const format = req.body.format || 'png';
        const quality = parseInt(req.body.quality) || 80;
        const width = req.body.width ? parseInt(req.body.width) : null;
        const height = req.body.height ? parseInt(req.body.height) : null;
        const maintainAspect = req.body.maintainAspect === 'true';

        let pipeline = sharp(req.file.buffer);

        // Resize logic
        if (width || height) {
            const resizeOptions = {
                fit: maintainAspect ? sharp.fit.inside : sharp.fit.fill
            };
            if (width) resizeOptions.width = width;
            if (height) resizeOptions.height = height;

            pipeline = pipeline.resize(resizeOptions);
        }

        // Format conversion
        // Supported formats: jpg, jpeg, png, webp, tiff

        let outputBuffer;
        let currentQuality = quality;
        const targetSizeBytes = req.body.targetSize ? parseInt(req.body.targetSize) : null;
        let iteration = 0;
        const maxIterations = 10;
        const minQuality = 10;

        // Helper to process pipeline with current settings
        const processImage = async (q) => {
            let options = { quality: q };
            // For PNG, quality acts differently in sharp (compression level), but we can map it or just use default specific settings if needed.
            // Sharp's png() quality option is actually fully supported in newer versions (palette quantization).
            // Let's stick to standard quality property for all methods where applicable.

            let currentPipeline = pipeline.clone(); // Clone to avoid mutating original pipeline state if that were an issue, though here we just chain.
            // actually pipeline is a sharp instance, we can chain off it. But resizing is already applied to 'pipeline'.
            // We need to re-apply format on the resized pipeline.

            switch (format.toLowerCase()) {
                case 'jpg':
                case 'jpeg':
                    return currentPipeline.jpeg(options).toBuffer();
                case 'png':
                    // PNG quality in sharp (libvips) can be tricky. aggressive compression might be needed.
                    // varying compressionLevel (0-9) or quality (0-100 for palette).
                    // simplified: use quality if set, otherwise default.
                    return currentPipeline.png({ quality: q, compressionLevel: 9 }).toBuffer();
                case 'webp':
                    return currentPipeline.webp(options).toBuffer();
                case 'tiff':
                    return currentPipeline.tiff(options).toBuffer();
                default:
                    return currentPipeline.toFormat(format, options).toBuffer();
            }
        };

        outputBuffer = await processImage(currentQuality);

        // Iterative compression if targetSize is set
        if (targetSizeBytes && targetSizeBytes > 0) {
            while (outputBuffer.length > targetSizeBytes && currentQuality > minQuality && iteration < maxIterations) {
                // Reduce quality.
                // Binary search is better but step-down is simpler for now.
                // Let's drop quality more aggressively if far off.
                const sizeRatio = outputBuffer.length / targetSizeBytes;
                let step = 10;

                if (sizeRatio > 2) step = 20;
                if (sizeRatio > 5) step = 30;

                currentQuality = Math.max(minQuality, currentQuality - step);
                console.log(`Target: ${targetSizeBytes}, Current: ${outputBuffer.length}, New Quality: ${currentQuality}`);

                outputBuffer = await processImage(currentQuality);
                iteration++;
            }
        }

        // correct mime type
        const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;

        res.set('Content-Type', mimeType);
        res.set('Content-Disposition', `attachment; filename="converted.${format}"`);
        res.send(outputBuffer);

    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ error: 'Image conversion failed', details: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
