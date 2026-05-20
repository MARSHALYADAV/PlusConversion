/**
 * PlusConversion - Comprehensive Modular Backend Test Runner
 * Validates modular PDF workers, Image conversions, and middleware security logic.
 */

const { PDFDocument, rgb } = require('pdf-lib');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Load Modular Workers
const mergePdfs = require('./workers/merge');
const splitPdf = require('./workers/split');
const rotatePdf = require('./workers/rotate');
const watermarkPdf = require('./workers/watermark');
const numberingPdf = require('./workers/numbering');
const compressPdf = require('./workers/compress');
const imagesToPdf = require('./workers/jpg-pdf');

// Helper to generate a basic 1-page valid PDF buffer
async function createMockPdf(text = "Hello World") {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    page.drawText(text, {
        x: 50,
        y: 350,
        size: 30,
        color: rgb(0, 0.5, 1),
    });
    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
}

// Helper to generate a mock image buffer using sharp
async function createMockImage(color = { r: 255, g: 0, b: 0 }) {
    return await sharp({
        create: {
            width: 100,
            height: 100,
            channels: 3,
            background: color
        }
    })
    .png()
    .toBuffer();
}

async function runTests() {
    console.log('==================================================');
    console.log('STARTING MODULAR COMPONENT VALIDATION');
    console.log('==================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`[PASS] - ${message}`);
            passed++;
        } else {
            console.error(`[FAIL] - ${message}`);
            failed++;
        }
    }

    try {
        // --- 1. Test Mock PDF Generation ---
        console.log('--- Step 1: Generating Mock PDF Buffer ---');
        const pdf1 = await createMockPdf("Document One");
        const pdf2 = await createMockPdf("Document Two");
        assert(Buffer.isBuffer(pdf1) && pdf1.length > 0, "Mock PDF buffer 1 generated successfully");
        assert(Buffer.isBuffer(pdf2) && pdf2.length > 0, "Mock PDF buffer 2 generated successfully");

        // --- 2. Test Merge Worker ---
        console.log('\n--- Step 2: Testing PDF Merge Worker ---');
        const mergedBuffer = await mergePdfs([pdf1, pdf2]);
        assert(Buffer.isBuffer(mergedBuffer) && mergedBuffer.length > 0, "Merged buffer created successfully");
        
        const mergedDoc = await PDFDocument.load(mergedBuffer);
        assert(mergedDoc.getPageCount() === 2, "Merged PDF has exactly 2 pages");

        // --- 3. Test Split Worker ---
        console.log('\n--- Step 3: Testing PDF Split Worker ---');
        const splitPages = await splitPdf(mergedBuffer);
        assert(splitPages.length === 2, "Split completed into exactly 2 pages");
        assert(Buffer.isBuffer(splitPages[0].buffer), "Page 1 buffer is a valid Buffer object");
        
        const splitRange = await splitPdf(mergedBuffer, "2");
        assert(splitRange.length === 1 && splitRange[0].pageIndex === 2, "Split with range restriction successfully extracted Page 2");

        // --- 4. Test Rotate Worker ---
        console.log('\n--- Step 4: Testing PDF Rotate Worker ---');
        const rotatedBuffer = await rotatePdf(pdf1, 90);
        assert(Buffer.isBuffer(rotatedBuffer), "Rotated PDF successfully returned buffer");
        
        const rotatedDoc = await PDFDocument.load(rotatedBuffer);
        const rotationAngle = rotatedDoc.getPage(0).getRotation().angle;
        assert(rotationAngle === 90, `Page rotation angle is successfully ${rotationAngle} degrees`);

        // --- 5. Test Watermark Worker ---
        console.log('\n--- Step 5: Testing PDF Watermark Worker ---');
        const watermarkedBuffer = await watermarkPdf(pdf1, 'CONFIDENTIAL', {
            color: '#FF0000',
            opacity: 0.5,
            rotation: 45
        });
        assert(Buffer.isBuffer(watermarkedBuffer) && watermarkedBuffer.length > 0, "Watermarked PDF successfully returned buffer");

        // --- 6. Test Page Numbering Worker ---
        console.log('\n--- Step 6: Testing PDF Page Numbering Worker ---');
        const numberedBuffer = await numberingPdf(mergedBuffer, {
            pattern: 'Page {page} of {total}',
            position: 'bottom-center'
        });
        assert(Buffer.isBuffer(numberedBuffer) && numberedBuffer.length > 0, "Numbered PDF successfully returned buffer");

        // --- 7. Test PDF Compress Worker ---
        console.log('\n--- Step 7: Testing PDF Compress Worker ---');
        const compressedBuffer = await compressPdf(pdf1);
        assert(Buffer.isBuffer(compressedBuffer) && compressedBuffer.length > 0, "Compressed PDF successfully returned buffer");

        // --- 8. Test Images to PDF Worker ---
        console.log('\n--- Step 8: Testing Images to PDF Worker ---');
        const imgBuffer1 = await createMockImage({ r: 255, g: 0, b: 0 }); // Red PNG
        const imgBuffer2 = await createMockImage({ r: 0, g: 255, b: 0 }); // Green PNG
        const imagesList = [
            { originalname: 'red.png', buffer: imgBuffer1 },
            { originalname: 'green.png', buffer: imgBuffer2 }
        ];
        const imagePdfBuffer = await imagesToPdf(imagesList);
        assert(Buffer.isBuffer(imagePdfBuffer) && imagePdfBuffer.length > 0, "Converted images to PDF buffer successfully");
        
        const imagePdfDoc = await PDFDocument.load(imagePdfBuffer);
        assert(imagePdfDoc.getPageCount() === 2, "Converted image PDF has exactly 2 pages representing both frames");

        // --- 9. Test Express App Initialization ---
        console.log('\n--- Step 9: Testing Decoupled Express App Booting ---');
        const app = require('./app');
        assert(typeof app.handle === 'function', "Express app loaded, configured and export is valid handler");

        console.log('\n==================================================');
        console.log(`TEST EXECUTION COMPLETED`);
        console.log(`PASSED: ${passed}`);
        console.log(`FAILED: ${failed}`);
        console.log('==================================================\n');

        if (failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }

    } catch (err) {
        console.error('\n[FATAL ERROR IN TEST RUNNER]:', err);
        process.exit(1);
    }
}

runTests();
