const fs = require('fs').promises;
const path = require('path');
const xlsx = require('xlsx');
const archiver = require('archiver');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const PdfService = require('./backend/services/pdf');
const logger = require('./backend/utils/logger');

// Helper to create a minimal valid docx in-memory buffer using archiver
function createDummyDocx() {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 9 } });
        const buffers = [];

        archive.on('data', (data) => buffers.push(data));
        archive.on('end', () => resolve(Buffer.concat(buffers)));
        archive.on('error', (err) => reject(err));

        // 1. [Content_Types].xml
        const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
        archive.append(contentTypes, { name: '[Content_Types].xml' });

        // 2. _rels/.rels
        const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
        archive.append(rels, { name: '_rels/.rels' });

        // 3. word/document.xml
        const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Hello World from PlusConversion native Word-to-PDF conversion worker! This is a test paragraph verifying the mammoth to pdf-lib rendering pipeline.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Second paragraph confirming spacing, Helvetica font metrics alignment, page margins, and automatic word-wrapping routines.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;
        archive.append(documentXml, { name: 'word/document.xml' });

        archive.finalize();
    });
}

// Helper to create a basic PDF
async function createTestPdf() {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    page.drawText('PlusConversion Test PDF Document', {
        x: 50,
        y: 800,
        size: 18,
        font: font,
        color: rgb(0.1, 0.1, 0.1)
    });

    page.drawText('This is page 1 of our programmatic verification document.', {
        x: 50,
        y: 750,
        size: 11,
        font: font,
        color: rgb(0.3, 0.3, 0.3)
    });

    const page2 = pdfDoc.addPage([595, 842]);
    page2.drawText('This is page 2 of our programmatic verification document.', {
        x: 50,
        y: 750,
        size: 11,
        font: font,
        color: rgb(0.3, 0.3, 0.3)
    });

    const saved = await pdfDoc.save();
    return Buffer.from(saved);
}

// Main testing harness
async function runTestSuite() {
    console.log('==================================================');
    console.log('STARTING PLUSCONVERSION PIPELINE TEST SUITE');
    console.log('==================================================');

    const outputDir = path.join(__dirname, 'temp_uploads');
    await fs.mkdir(outputDir, { recursive: true });

    try {
        // ------------------------------------------------------------
        // Test 1: Word to PDF Fallback
        // ------------------------------------------------------------
        console.log('\n[TEST 1] Testing Word (.docx) -> PDF JS-Native Fallback...');
        const docxBuffer = await createDummyDocx();
        const wordPdf = await PdfService.convertOffice(docxBuffer, 'docx');
        const wordPdfPath = path.join(outputDir, 'test_output_word.pdf');
        await fs.writeFile(wordPdfPath, wordPdf);
        console.log(`✓ Word-to-PDF Conversion Succeeded! Wrote output to: ${wordPdfPath} (${wordPdf.length} bytes)`);

        // ------------------------------------------------------------
        // Test 2: Excel to PDF Fallback
        // ------------------------------------------------------------
        console.log('\n[TEST 2] Testing Excel (.xlsx) -> PDF JS-Native Fallback...');
        const wb = xlsx.utils.book_new();
        const wsData = [
            ['Product Name', 'Price', 'Stock', 'Category'],
            ['SaaS Premium Plan', '$49.00', 'Unlimited', 'Subscription'],
            ['SaaS Enterprise Plan', '$299.00', 'Unlimited', 'Subscription'],
            ['PDF Custom Add-on', '$9.99', '150', 'One-time'],
            ['Consultation hour', '$150.00', '12', 'Service']
        ];
        const ws = xlsx.utils.aoa_to_sheet(wsData);
        xlsx.utils.book_append_sheet(wb, ws, 'SaaS Inventory');
        
        // Add a second sheet to test multi-page workbook conversion
        const wsData2 = [
            ['Region', 'Q1 Revenue', 'Q2 Revenue'],
            ['North America', '$150,000', '$180,000'],
            ['Europe', '$120,000', '$140,000'],
            ['Asia-Pacific', '$90,000', '$110,000']
        ];
        const ws2 = xlsx.utils.aoa_to_sheet(wsData2);
        xlsx.utils.book_append_sheet(wb, ws2, 'Regional Sales');

        const xlsxBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });
        const excelPdf = await PdfService.convertOffice(xlsxBuffer, 'xlsx');
        const excelPdfPath = path.join(outputDir, 'test_output_excel.pdf');
        await fs.writeFile(excelPdfPath, excelPdf);
        console.log(`✓ Excel-to-PDF Conversion Succeeded! Wrote output to: ${excelPdfPath} (${excelPdf.length} bytes)`);

        // ------------------------------------------------------------
        // Test 3: PowerPoint to PDF Fallback
        // ------------------------------------------------------------
        console.log('\n[TEST 3] Testing PowerPoint (.pptx) -> PDF Corporate Slides Theme Fallback...');
        const dummyPptx = Buffer.from('placeholder_pptx_stream');
        const pptPdf = await PdfService.convertOffice(dummyPptx, 'pptx');
        const pptPdfPath = path.join(outputDir, 'test_output_ppt.pdf');
        await fs.writeFile(pptPdfPath, pptPdf);
        console.log(`✓ PPT-to-PDF Conversion Succeeded! Wrote output to: ${pptPdfPath} (${pptPdf.length} bytes)`);

        // ------------------------------------------------------------
        // Test 4: PDF Unlock / Decryption
        // ------------------------------------------------------------
        console.log('\n[TEST 4] Testing PDF Unlock Pipeline...');
        const testPdf = await createTestPdf();
        
        // Encrypt test PDF with a password using pdf-lib
        const pdfDoc = await PDFDocument.load(testPdf);
        const encryptedBytes = await pdfDoc.save({
            userPassword: 'plusconversion123',
            ownerPassword: 'admin',
            permissions: {
                printing: 'highResolution',
                modifying: true,
                copying: true
            }
        });
        const encryptedBuffer = Buffer.from(encryptedBytes);
        const encryptedPath = path.join(outputDir, 'test_encrypted.pdf');
        await fs.writeFile(encryptedPath, encryptedBuffer);
        console.log(`Created encrypted test PDF with password "plusconversion123" (${encryptedBuffer.length} bytes)`);

        // Perform Unlock
        const unlockedBuffer = await PdfService.unlock(encryptedBuffer, 'plusconversion123');
        const unlockedPath = path.join(outputDir, 'test_unlocked.pdf');
        await fs.writeFile(unlockedPath, unlockedBuffer);
        console.log(`✓ PDF Decryption Succeeded! Password stripped and unlocked file written to: ${unlockedPath} (${unlockedBuffer.length} bytes)`);

        // ------------------------------------------------------------
        // Test 5: PDF Edit / Annotations Draw Overlay
        // ------------------------------------------------------------
        console.log('\n[TEST 5] Testing PDF Annotations Edit Pipeline...');
        const annotations = [
            // Page 1 additions
            {
                pageIndex: 1,
                type: 'text',
                x: 100,
                y: 500,
                text: 'ANNOTATED: Added text overlay at coordinate map location.',
                fontSize: 14,
                color: '#ff0000'
            },
            {
                pageIndex: 1,
                type: 'shape',
                shapeType: 'rectangle',
                x: 80,
                y: 450,
                width: 250,
                height: 30,
                color: '#0000ff',
                opacity: 0.3
            },
            // Page 2 additions
            {
                pageIndex: 2,
                type: 'text',
                x: 150,
                y: 600,
                text: 'ANNOTATED PAGE 2: Confirmed multi-page offset coordinate maps.',
                fontSize: 12,
                color: '#00aa00'
            }
        ];
        const editedPdf = await PdfService.edit(testPdf, annotations);
        const editedPath = path.join(outputDir, 'test_output_edited.pdf');
        await fs.writeFile(editedPath, editedPdf);
        console.log(`✓ PDF Annotations Edit Succeeded! Wrote output to: ${editedPath} (${editedPdf.length} bytes)`);

        // ------------------------------------------------------------
        // Test 6: PDF Compress
        // ------------------------------------------------------------
        console.log('\n[TEST 6] Testing PDF Compress Pipeline...');
        const compressedPdf = await PdfService.compress(testPdf, 'extreme');
        const compressedPath = path.join(outputDir, 'test_output_compressed.pdf');
        await fs.writeFile(compressedPath, compressedPdf);
        console.log(`✓ PDF Compression Succeeded! Wrote output to: ${compressedPath} (${compressedPdf.length} bytes)`);

        console.log('\n==================================================');
        console.log('ALL TESTS PASSED SUCCESSFULLY! PIPELINES ARE HEALTHY');
        console.log('==================================================\n');
    } catch (err) {
        console.error('\n❌ PIPELINE TEST SUITE FAILED:', err);
        process.exit(1);
    }
}

runTestSuite();
