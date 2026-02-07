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
        // Supported formats: jpg, jpeg, png, webp, tiff, bmp (via user request, mostly supported by sharp natively)
        // Note: bmp output support in sharp might be limited or require specific config, but common web formats are fine.
        // Let's stick to common ones for MVP: jpeg, png, webp.
        
        switch (format.toLowerCase()) {
            case 'jpg':
            case 'jpeg':
                pipeline = pipeline.jpeg({ quality: quality });
                break;
            case 'png':
                pipeline = pipeline.png({ quality: quality }); // PNG quality is effort/compression usually, but sharp maps it
                break;
            case 'webp':
                pipeline = pipeline.webp({ quality: quality });
                break;
             case 'tiff':
                pipeline = pipeline.tiff({ quality: quality });
                break;
            default:
                // Default to png if unknown or same as input if possible (but we want explicit conversion)
                 pipeline = pipeline.toFormat(format, { quality: quality });
        }

        const outputBuffer = await pipeline.toBuffer();

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
