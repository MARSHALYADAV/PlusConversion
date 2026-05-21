const { PDFDocument, PDFName, PDFRawStream } = require('pdf-lib');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const logger = require('../../utils/logger');

// Quality and dimension configs based on compression mode
const MODE_CONFIGS = {
    low: {
        quality: 80,
        maxDim: 2048,
        gsSettings: '/printer',
        stripMetadata: false
    },
    recommended: {
        quality: 60,
        maxDim: 1200,
        gsSettings: '/ebook',
        stripMetadata: false
    },
    extreme: {
        quality: 40,
        maxDim: 800,
        gsSettings: '/screen',
        stripMetadata: true
    }
};

/**
 * Compress a PDF by downscaling and re-encoding internal images, or using Ghostscript if available.
 * @param {Buffer} pdfBuffer
 * @param {string} mode - 'low' | 'recommended' | 'extreme'
 * @returns {Promise<Buffer>} Compressed PDF buffer
 */
async function compressPdf(pdfBuffer, mode = 'recommended') {
    const config = MODE_CONFIGS[mode] || MODE_CONFIGS.recommended;
    logger.info(`Starting PDF compress worker in "${mode}" mode`);

    if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('No PDF buffer provided for compression');
    }

    // --- PIPELINE 1: Attempt Ghostscript (gs) ---
    try {
        const hasGs = await checkCommand('gs');
        if (hasGs) {
            logger.info('Ghostscript detected. Using gs pipeline...');
            return await compressWithGhostscript(pdfBuffer, config.gsSettings);
        }
    } catch (gsErr) {
        logger.warn(`Ghostscript pipeline failed, falling back to JS-native compressor: ${gsErr.message}`);
    }

    // --- PIPELINE 2: JS-Native pdf-lib + sharp image compressor ---
    logger.info('Using JS-native pdf-lib + sharp compressor...');
    return await compressWithJsNative(pdfBuffer, config);
}

/**
 * Check if a shell command is available
 */
async function checkCommand(cmd) {
    try {
        await execPromise(`which ${cmd}`);
        return true;
    } catch {
        return false;
    }
}

/**
 * Ghostscript PDF Compression
 */
async function compressWithGhostscript(pdfBuffer, gsSettings) {
    const tempDir = path.join(__dirname, '../../../temp_uploads');
    await fs.mkdir(tempDir, { recursive: true });

    const inputPath = path.join(tempDir, `compress_in_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
    const outputPath = path.join(tempDir, `compress_out_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);

    try {
        await fs.writeFile(inputPath, pdfBuffer);

        // Command for Ghostscript compression
        const cmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsSettings} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
        logger.info(`Executing GS command: ${cmd}`);
        await execPromise(cmd);

        const compressedBuffer = await fs.readFile(outputPath);
        logger.info(`GS Compression Successful: ${pdfBuffer.length} B -> ${compressedBuffer.length} B`);
        return compressedBuffer;
    } finally {
        // Clean up temp files
        await safeUnlink(inputPath);
        await safeUnlink(outputPath);
    }
}

/**
 * JS-Native Image Compressor (pdf-lib + sharp)
 */
async function compressWithJsNative(pdfBuffer, config) {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { 
        ignoreEncryption: true 
    });

    const indirectObjects = pdfDoc.context.indirectObjects;
    let imageCount = 0;
    let compressedCount = 0;

    for (const [ref, obj] of indirectObjects) {
        if (obj instanceof PDFRawStream) {
            const dict = obj.dict;
            const subtype = dict.get(PDFName.of('Subtype'));
            
            if (subtype === PDFName.of('Image')) {
                imageCount++;
                try {
                    // Extract the raw image bytes
                    let imageBytes;
                    try {
                        imageBytes = obj.getUncompressedContents();
                    } catch {
                        imageBytes = obj.contents;
                    }

                    if (!imageBytes || imageBytes.length === 0) continue;

                    // Parse image metadata with sharp
                    const metadata = await sharp(imageBytes).metadata().catch(() => null);
                    if (!metadata) continue;

                    // Compress based on whether transparency is present
                    let compressedBytes;
                    let isPng = metadata.format === 'png' || (metadata.hasAlpha && metadata.format !== 'jpeg');

                    let sh = sharp(imageBytes)
                        .resize({
                            width: config.maxDim,
                            height: config.maxDim,
                            fit: 'inside',
                            withoutEnlargement: true
                        });

                    if (isPng) {
                        compressedBytes = await sh
                            .png({ palette: true, quality: config.quality, compressionLevel: 9 })
                            .toBuffer();
                    } else {
                        compressedBytes = await sh
                            .jpeg({ quality: config.quality, progressive: true, mozjpeg: true })
                            .toBuffer();
                    }

                    if (compressedBytes.length < imageBytes.length) {
                        // Embed the compressed image in a separate document context to construct a valid PDF stream
                        const tempDoc = await PDFDocument.create();
                        let embeddedImage;
                        if (isPng) {
                            embeddedImage = await tempDoc.embedPng(compressedBytes);
                        } else {
                            embeddedImage = await tempDoc.embedJpg(compressedBytes);
                        }

                        const newStreamObj = tempDoc.context.lookup(embeddedImage.ref);

                        // Complete in-place replacement of the original stream contents and dict keys
                        obj.contents = newStreamObj.contents;
                        
                        // Overwrite old dictionary entries with new ones (preserves references, width, height, filters, etc.)
                        for (const key of newStreamObj.dict.keys()) {
                            obj.dict.set(key, newStreamObj.dict.get(key));
                        }

                        // Remove keys that are not present in the new stream dictionary
                        for (const key of obj.dict.keys()) {
                            if (!newStreamObj.dict.has(key)) {
                                obj.dict.delete(key);
                            }
                        }

                        compressedCount++;
                    }
                } catch (imgErr) {
                    logger.debug(`Skipped compressing specific image object: ${imgErr.message}`);
                }
            }
        }
    }

    logger.info(`JS-Native Compressor: Compressed ${compressedCount}/${imageCount} images inside PDF`);

    // Extreme mode metadata stripping
    if (config.stripMetadata) {
        logger.info('Stripping PDF metadata (extreme mode)...');
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');
    }

    const savedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addGlyphMapGroups: false
    });

    const finalBuffer = Buffer.from(savedBytes);
    logger.info(`JS Compression Finished: ${pdfBuffer.length} B -> ${finalBuffer.length} B`);
    return finalBuffer;
}

/**
 * Safely delete a file
 */
async function safeUnlink(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            logger.warn(`Failed to clean up temp file ${filePath}: ${err.message}`);
        }
    }
}

module.exports = compressPdf;
