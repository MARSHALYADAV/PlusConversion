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
        let iteration = 0;
        const maxIterations = 10;
        const minQuality = 10;
        const targetSizeBytes = req.body.targetSize ? parseInt(req.body.targetSize) : null;

        // Helper to process pipeline with current settings
        const processImage = async (q) => {
            let options = { quality: q };
            let currentPipeline = pipeline.clone();

            switch (format.toLowerCase()) {
                case 'jpg':
                case 'jpeg':
                    return currentPipeline.jpeg(options).toBuffer();
                case 'png':
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
            // 1. Try reducing quality
            while (outputBuffer.length > targetSizeBytes && currentQuality > minQuality && iteration < maxIterations) {
                const sizeRatio = outputBuffer.length / targetSizeBytes;
                let step = 10;

                if (sizeRatio > 2) step = 20;
                if (sizeRatio > 5) step = 30;

                currentQuality = Math.max(minQuality, currentQuality - step);

                outputBuffer = await processImage(currentQuality);
                iteration++;
            }

            // 2. If still too large, try resizing
            let currentWidth = width;
            let currentHeight = height;

            if (outputBuffer.length > targetSizeBytes) {
                // Get dimensions if we don't have them yet
                if (!currentWidth || !currentHeight) {
                    const meta = await sharp(req.file.buffer).metadata();
                    currentWidth = meta.width;
                    currentHeight = meta.height;
                }

                while (outputBuffer.length > targetSizeBytes && (currentWidth > 50 || currentHeight > 50) && iteration < maxIterations + 5) {
                    const scaleFactor = 0.8; // Reduce by 20%
                    currentWidth = Math.round(currentWidth * scaleFactor);
                    currentHeight = Math.round(currentHeight * scaleFactor);

                    let resizeOptions = {
                        width: currentWidth,
                        height: currentHeight,
                        fit: sharp.fit.fill
                    };

                    let resizePipeline = sharp(req.file.buffer).resize(resizeOptions);
                    let options = { quality: currentQuality };

                    switch (format.toLowerCase()) {
                        case 'jpg':
                        case 'jpeg':
                            outputBuffer = await resizePipeline.jpeg(options).toBuffer();
                            break;
                        case 'png':
                            outputBuffer = await resizePipeline.png({ quality: currentQuality, compressionLevel: 9 }).toBuffer();
                            break;
                        case 'webp':
                            outputBuffer = await resizePipeline.webp(options).toBuffer();
                            break;
                        case 'tiff':
                            outputBuffer = await resizePipeline.tiff(options).toBuffer();
                            break;
                        default:
                            outputBuffer = await resizePipeline.toFormat(format, options).toBuffer();
                    }
                    iteration++;
                }
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
