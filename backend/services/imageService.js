const sharp = require('sharp');
const heicConvert = require('heic-convert');
const path = require('path');

class ImageService {
    /**
     * Decodes and converts a HEIC buffer to a PNG or JPEG buffer.
     */
    static async decodeHeic(buffer, toFormat = 'PNG') {
        try {
            // Attempt to decode with Sharp (if system libraries are configured)
            await sharp(buffer).resize(1, 1).toBuffer();
            return buffer;
        } catch (err) {
            console.log('Sharp native HEIC decode failed. Using heic-convert...');
            return await heicConvert({
                buffer: buffer,
                format: toFormat,
                quality: 1
            });
        }
    }

    /**
     * Generates a fast preview for an uploaded image.
     */
    static async generatePreview(file) {
        let bufferToProcess = file.buffer;
        const isHeic = file.mimetype === 'image/heic' || file.mimetype === 'image/heif' ||
            file.originalname.toLowerCase().endsWith('.heic') || file.originalname.toLowerCase().endsWith('.heif');

        if (isHeic) {
            bufferToProcess = await this.decodeHeic(bufferToProcess, 'JPEG');
        }

        return await sharp(bufferToProcess)
            .resize({ width: 300, height: 300, fit: sharp.fit.inside })
            .jpeg({ quality: 70 })
            .toBuffer();
    }

    /**
     * Core image processing engine. Resizes, flattens, adjusts quality, and optimizes to target size constraints.
     */
    static async processImage(file, options = {}) {
        const format = (options.format || 'png').toLowerCase();
        const quality = parseInt(options.quality) || 80;
        const width = options.width ? parseInt(options.width) : null;
        const height = options.height ? parseInt(options.height) : null;
        const maintainAspect = options.maintainAspect !== false;
        const targetSizeBytes = options.targetSize ? parseInt(options.targetSize) : null;
        const keepMetadata = options.keepMetadata === true;
        const useTransparency = options.useTransparency === true;
        const backgroundColor = options.backgroundColor || '#ffffff';

        let bufferToProcess = file.buffer;
        const isHeic = file.mimetype === 'image/heic' || file.mimetype === 'image/heif' ||
            file.originalname.toLowerCase().endsWith('.heic') || file.originalname.toLowerCase().endsWith('.heif');

        if (isHeic) {
            bufferToProcess = await this.decodeHeic(bufferToProcess, 'PNG');
        }

        let pipeline = sharp(bufferToProcess);

        // EXIF Metadata
        if (keepMetadata) {
            pipeline = pipeline.withMetadata();
        }

        // Apply Resize
        if (width || height) {
            const resizeOptions = {
                fit: maintainAspect ? sharp.fit.inside : sharp.fit.fill
            };
            if (width) resizeOptions.width = width;
            if (height) resizeOptions.height = height;
            pipeline = pipeline.resize(resizeOptions);
        }

        // Transparency flattening
        const noAlphaFormats = ['jpg', 'jpeg', 'bmp'];
        const outputHasNoAlpha = noAlphaFormats.includes(format);

        if (outputHasNoAlpha || useTransparency) {
            pipeline = pipeline.flatten({ background: backgroundColor });
        }

        // Output helper for specific format & quality mapping
        const getFormatBuffer = async (currentPipeline, q) => {
            let p = currentPipeline.clone();
            switch (format) {
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

        // Iterative Target Size matching logic
        const minQuality = 10;
        const maxQualityIterations = 10;
        const maxResizeIterations = 20;

        let currentQuality = quality;

        if (targetSizeBytes && targetSizeBytes > 0) {
            // Step 1: Reduce quality incrementally
            let qIteration = 0;
            while (outputBuffer.length > targetSizeBytes && currentQuality > minQuality && qIteration < maxQualityIterations) {
                const sizeRatio = outputBuffer.length / targetSizeBytes;
                const step = sizeRatio > 2 ? 20 : 10;

                currentQuality = Math.max(minQuality, currentQuality - step);
                outputBuffer = await getFormatBuffer(pipeline, currentQuality);
                qIteration++;
            }

            // Step 2: Scale image dimensions down iteratively if still too large
            let currentWidth = width;
            let currentHeight = height;

            if (outputBuffer.length > targetSizeBytes) {
                if (!currentWidth || !currentHeight) {
                    try {
                        const meta = await sharp(bufferToProcess).metadata();
                        currentWidth = width || meta.width;
                        currentHeight = height || meta.height;
                    } catch (e) {
                        currentWidth = 1000;
                        currentHeight = 1000;
                    }
                }

                let rIteration = 0;
                while (outputBuffer.length > targetSizeBytes && (currentWidth > 50 || currentHeight > 50) && rIteration < maxResizeIterations) {
                    const sizeRatio = outputBuffer.length / targetSizeBytes;
                    let scaleFactor = 0.85;
                    if (sizeRatio > 2) scaleFactor = 0.70;
                    if (sizeRatio > 4) scaleFactor = 0.50;

                    currentWidth = Math.round(currentWidth * scaleFactor);
                    currentHeight = Math.round(currentHeight * scaleFactor);

                    const resizeOptions = {
                        width: currentWidth,
                        height: currentHeight,
                        fit: maintainAspect ? sharp.fit.inside : sharp.fit.fill
                    };

                    let resizePipeline = sharp(bufferToProcess).resize(resizeOptions);
                    if (keepMetadata) resizePipeline = resizePipeline.withMetadata();
                    if (outputHasNoAlpha || useTransparency) {
                        resizePipeline = resizePipeline.flatten({ background: backgroundColor });
                    }

                    outputBuffer = await getFormatBuffer(resizePipeline, currentQuality);
                    rIteration++;
                }
            }
        }

        return {
            buffer: outputBuffer,
            format: format,
            mimeType: `image/${format === 'jpg' ? 'jpeg' : format}`
        };
    }
}

module.exports = ImageService;
