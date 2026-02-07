const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const path = require('path');
const archiver = require('archiver');
const heicConvert = require('heic-convert');

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
        fileSize: 50 * 1024 * 1024 // 50MB limit per file
    }
});

// API Endpoint for previews (mainly for HEIC)
app.post('/api/preview', upload.single('image'), async (req, res) => {
    console.log('Preview request received');
    if (req.file) {
        console.log(`File: ${req.file.originalname}, Size: ${req.file.size} bytes, Mime: ${req.file.mimetype}`);
    }

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        let inputBuffer = req.file.buffer;
        let buffer;

        // HEIC Logic with robust check
        const isHeic = req.file.mimetype === 'image/heic' || req.file.mimetype === 'image/heif' ||
            req.file.originalname.toLowerCase().endsWith('.heic') || req.file.originalname.toLowerCase().endsWith('.heif');

        if (isHeic) {
            try {
                // Try to decode a tiny pixel to verify Sharp support
                await sharp(inputBuffer).resize(1, 1).toBuffer();
                // If success, use Sharp normally
                buffer = await sharp(inputBuffer)
                    .resize({ width: 300, height: 300, fit: sharp.fit.inside })
                    .jpeg({ quality: 70 })
                    .toBuffer();
            } catch (e) {
                console.log(`Sharp failed to decode HEIC preview for ${req.file.originalname}, using heic-convert...`);
                try {
                    const outputBuffer = await heicConvert({
                        buffer: inputBuffer,
                        format: 'JPEG',
                        quality: 0.7
                    });

                    // Resize the converted JPEG using Sharp
                    buffer = await sharp(outputBuffer)
                        .resize({ width: 300, height: 300, fit: sharp.fit.inside })
                        .jpeg({ quality: 70 })
                        .toBuffer();

                    console.log('Preview generated with heic-convert + Sharp');
                } catch (heicErr) {
                    console.error('heic-convert preview failed:', heicErr);
                    throw heicErr;
                }
            }
        } else {
            // Normal image
            buffer = await sharp(inputBuffer)
                .resize({ width: 300, height: 300, fit: sharp.fit.inside })
                .jpeg({ quality: 70 })
                .toBuffer();
        }

        console.log('Preview generated successfully');
        res.set('Content-Type', 'image/jpeg');
        res.send(buffer);
    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({ error: 'Preview generation failed', details: error.message });
    }
});

// API Endpoint for image conversion
app.post('/api/convert', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No image files uploaded' });
        }

        const format = req.body.format || 'png';
        const quality = parseInt(req.body.quality) || 80;
        const width = req.body.width ? parseInt(req.body.width) : null;
        const height = req.body.height ? parseInt(req.body.height) : null;
        const maintainAspect = req.body.maintainAspect === 'true';
        const targetSizeBytes = req.body.targetSize ? parseInt(req.body.targetSize) : null;

        // Advanced Options
        const keepMetadata = req.body.keepMetadata === 'true';
        const useTransparency = req.body.useTransparency === 'true';
        const backgroundColor = req.body.backgroundColor || '#ffffff'; // Default white

        // Helper function to process a single file
        const processSingleFile = async (file) => {
            let bufferToProcess = file.buffer;

            // HEIC Logic with robust check
            const isHeic = file.mimetype === 'image/heic' || file.mimetype === 'image/heif' ||
                file.originalname.toLowerCase().endsWith('.heic') || file.originalname.toLowerCase().endsWith('.heif');

            if (isHeic) {
                try {
                    // Try to actually decode pixels (metadata check is insufficient)
                    await sharp(bufferToProcess).resize(1, 1).toBuffer();
                } catch (e) {
                    console.log(`Sharp failed on HEIC input ${file.originalname}, converting with heic-convert...`);
                    try {
                        bufferToProcess = await heicConvert({
                            buffer: file.buffer,
                            format: 'PNG'
                        });
                    } catch (heicErr) {
                        console.error('heic-convert failed:', heicErr);
                        throw heicErr;
                    }
                }
            }

            let pipeline = sharp(bufferToProcess);

            // Metadata
            if (keepMetadata) {
                pipeline = pipeline.withMetadata();
            }

            // Resize logic
            if (width || height) {
                const resizeOptions = {
                    fit: maintainAspect ? sharp.fit.inside : sharp.fit.fill
                };
                if (width) resizeOptions.width = width;
                if (height) resizeOptions.height = height;
                pipeline = pipeline.resize(resizeOptions);
            }

            // Transparency / Background
            const noAlphaFormats = ['jpg', 'jpeg', 'bmp'];
            const outputHasNoAlpha = noAlphaFormats.includes(format.toLowerCase());

            if (outputHasNoAlpha || useTransparency) {
                pipeline = pipeline.flatten({ background: backgroundColor });
            }

            // Helper for format/quality
            const getFormatBuffer = async (currentPipeline, q) => {
                let p = currentPipeline.clone();
                switch (format.toLowerCase()) {
                    case 'jpg':
                    case 'jpeg':
                        return p.jpeg({ quality: q }).toBuffer();
                    case 'png':
                        return p.png({ quality: q, compressionLevel: 9 }).toBuffer();
                    case 'webp':
                        return p.webp({ quality: q }).toBuffer();
                    case 'tiff':
                        return p.tiff({ quality: q }).toBuffer();
                    case 'bmp':
                        return p.toFormat('bmp').toBuffer();
                    default:
                        return p.toFormat(format, { quality: q }).toBuffer();
                }
            };

            let outputBuffer = await getFormatBuffer(pipeline, quality);

            // Target Size Logic (Iterative)
            const minQuality = 10;
            const maxQualityIterations = 10; // separate limit for quality
            const maxResizeIterations = 20;  // separate limit and higher for resize

            let currentQuality = quality;

            if (targetSizeBytes && targetSizeBytes > 0) {
                // 1. Reduce Quality
                let qIteration = 0;
                while (outputBuffer.length > targetSizeBytes && currentQuality > minQuality && qIteration < maxQualityIterations) {
                    const sizeRatio = outputBuffer.length / targetSizeBytes;
                    let step = 10;
                    if (sizeRatio > 2) step = 20;

                    currentQuality = Math.max(minQuality, currentQuality - step);
                    outputBuffer = await getFormatBuffer(pipeline, currentQuality);
                    qIteration++;
                }

                // 2. Fallback Resize
                let currentWidth = width;
                let currentHeight = height;

                if (outputBuffer.length > targetSizeBytes) {
                    if (!currentWidth || !currentHeight) {
                        try {
                            const meta = await sharp(bufferToProcess).metadata();
                            currentWidth = width || meta.width;
                            currentHeight = height || meta.height;
                        } catch (e) {
                            currentWidth = 1000; currentHeight = 1000; // fallback arbitrary
                        }
                    }

                    let rIteration = 0;
                    while (outputBuffer.length > targetSizeBytes && (currentWidth > 50 || currentHeight > 50) && rIteration < maxResizeIterations) {
                        const sizeRatio = outputBuffer.length / targetSizeBytes;
                        let scaleFactor = 0.85;
                        if (sizeRatio > 2) scaleFactor = 0.70; // Aggressive scale down
                        if (sizeRatio > 4) scaleFactor = 0.50; // Very aggressive

                        currentWidth = Math.round(currentWidth * scaleFactor);
                        currentHeight = Math.round(currentHeight * scaleFactor);

                        let resizeOptions = { width: currentWidth, height: currentHeight, fit: sharp.fit.fill };

                        // Fix aspect ratio logic for fallback resize
                        // If maintainAspect was true, we want to keep fitting inside the new smaller box
                        if (maintainAspect) {
                            resizeOptions.fit = sharp.fit.inside;
                        }

                        let resizePipeline = sharp(bufferToProcess).resize(resizeOptions);
                        if (keepMetadata) resizePipeline = resizePipeline.withMetadata();
                        if (outputHasNoAlpha || useTransparency) resizePipeline = resizePipeline.flatten({ background: backgroundColor });

                        outputBuffer = await getFormatBuffer(resizePipeline, currentQuality);
                        rIteration++;
                    }
                }
            }
            return outputBuffer;
        };

        // --- Processing Request ---

        if (req.files.length === 1) {
            // Single file - Return directly
            const buffer = await processSingleFile(req.files[0]);

            const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
            res.set('Content-Type', mimeType);
            res.set('Content-Disposition', `attachment; filename="converted.${format}"`);
            res.send(buffer);
        } else {
            // Multiple files - Return ZIP
            const archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });

            res.set('Content-Type', 'application/zip');
            res.set('Content-Disposition', 'attachment; filename="converted_images.zip"');

            archive.pipe(res);

            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                try {
                    const buffer = await processSingleFile(file);
                    // Original name without extension
                    const originalName = path.parse(file.originalname).name;
                    const fileName = `${originalName}_converted.${format}`;

                    archive.append(buffer, { name: fileName });
                } catch (err) {
                    console.error(`Error processing file ${file.originalname}:`, err);
                }
            }

            await archive.finalize();
        }

    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ error: 'Image conversion failed', details: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
