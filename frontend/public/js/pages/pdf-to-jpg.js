import { applyPageIcons } from '../utils/pageIcons.js';
import Navbar from '../components/navbar.js';
import DropZone from '../components/dropzone.js';
import ProgressUI from '../components/progressUI.js';
import ResultCard from '../components/resultCard.js';
import Toast from '../components/toast.js';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
    Navbar.init('navbar-container');

    const progressUI = new ProgressUI('progress-container');
    const resultCard = new ResultCard('result-container');

    const dropZone = new DropZone('dropzone-container', {
        accept: '.pdf',
        multiple: false,
        title: 'Upload PDF to convert',
        subtitle: 'or drag and drop here',
        onFilesSelected: async (files) => {
            const file = files[0];
            if (!file) return;

            dropZone.hide();
            progressUI.show('Preparing browser environment...');
            
            try {
                await processPdfToJpg(file, progressUI, resultCard);
            } catch (err) {
                console.error(err);
                progressUI.hide();
                dropZone.show();
                Toast.show('Failed to convert PDF: ' + err.message, 'error');
            }
        }
    });

    resultCard.onRestart(() => {
        resultCard.hide();
        dropZone.show();
    });
});

/**
 * Main function to convert PDF to JPG(s) using browser-side pdf.js
 */
async function processPdfToJpg(file, progressUI, resultCard) {
    progressUI.update('Reading PDF file...', 10);
    
    // 1. Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 2. Load PDF document
    progressUI.update('Parsing PDF structure...', 20);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    const zip = new JSZip();
    let singleBlob = null;

    // 3. Render pages
    for (let i = 1; i <= numPages; i++) {
        const percent = 20 + Math.floor((i / numPages) * 70);
        progressUI.update(`Rendering page ${i} of ${numPages}...`, percent);

        const page = await pdf.getPage(i);
        
        // Use a scale multiplier for high-res output
        const scale = 2.0; 
        const viewport = page.getViewport({ scale });

        // Prepare canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        await page.render(renderContext).promise;

        // Convert canvas to JPG blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));

        if (numPages === 1) {
            singleBlob = blob;
        } else {
            // Pad page numbers with leading zeros (e.g., page_01.jpg, page_02.jpg)
            const paddedNum = i.toString().padStart(numPages.toString().length, '0');
            zip.file(`page_${paddedNum}.jpg`, blob);
        }
    }

    progressUI.update('Finalizing output...', 95);

    // 4. Prepare Download
    let downloadUrl;
    let filename;
    let sizeBytes;

    if (numPages === 1) {
        // Single JPG download
        downloadUrl = URL.createObjectURL(singleBlob);
        filename = file.name.replace(/\.pdf$/i, '.jpg');
        sizeBytes = singleBlob.size;
    } else {
        // ZIP download
        progressUI.update('Compressing ZIP file...', 98);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadUrl = URL.createObjectURL(zipBlob);
        filename = file.name.replace(/\.pdf$/i, '_pages.zip');
        sizeBytes = zipBlob.size;
    }

    progressUI.hide();

    // Show result card
    resultCard.show({
        filename: filename,
        size: sizeBytes,
        downloadUrl: downloadUrl
    });

    Toast.show('Conversion successful!', 'success');
}
