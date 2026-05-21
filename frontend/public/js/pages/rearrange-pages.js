import Navbar from '../components/navbar.js';
import DropZone from '../components/dropzone.js';
import ProgressUI from '../components/progressUI.js';
import ResultCard from '../components/resultCard.js';
import Toast from '../components/toast.js';
import PageSorter from '../components/pageSorter.js';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
    Navbar.init('navbar-container');

    const progressUI = new ProgressUI('progress-container');
    const resultCard = new ResultCard('result-container');
    let currentArrayBuffer = null;
    let originalFilename = '';

    const pageSorter = new PageSorter('page-sorter-container', {
        mode: 'rearrange',
        onProcess: async (pagesToKeep) => {
            pageSorter.hide();
            progressUI.show('Processing rearranged PDF...');
            try {
                await executeRearrange(currentArrayBuffer, pagesToKeep, originalFilename, progressUI, resultCard);
            } catch (err) {
                console.error(err);
                progressUI.hide();
                pageSorter.show();
                Toast.show('Failed to rearrange PDF: ' + err.message, 'error');
            }
        }
    });

    const dropZone = new DropZone('dropzone-container', {
        accept: '.pdf',
        multiple: false,
        title: 'Upload PDF to rearrange',
        subtitle: 'or drag and drop here',
        onFilesSelected: async (files) => {
            const file = files[0];
            if (!file) return;

            originalFilename = file.name;
            dropZone.hide();
            progressUI.show('Reading file...');
            
            try {
                currentArrayBuffer = await file.arrayBuffer();
                progressUI.hide();
                await pageSorter.loadPdf(currentArrayBuffer);
            } catch (err) {
                console.error(err);
                progressUI.hide();
                dropZone.show();
                Toast.show('Failed to read PDF: ' + err.message, 'error');
            }
        }
    });

    resultCard.onRestart(() => {
        resultCard.hide();
        currentArrayBuffer = null;
        dropZone.show();
    });
});

async function executeRearrange(arrayBuffer, pagesToKeep, filename, progressUI, resultCard) {
    progressUI.update('Loading PDF binary...', 20);
    const { PDFDocument } = PDFLib;

    const originalDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    
    progressUI.update('Creating rearranged document...', 50);
    const newDoc = await PDFDocument.create();

    const copiedPages = await newDoc.copyPages(originalDoc, pagesToKeep);
    copiedPages.forEach(page => {
        newDoc.addPage(page);
    });

    progressUI.update('Saving PDF...', 80);
    const pdfBytes = await newDoc.save();

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const outFilename = filename.replace(/\.pdf$/i, '_rearranged.pdf');

    progressUI.hide();
    resultCard.show({
        filename: outFilename,
        size: blob.size,
        downloadUrl: downloadUrl
    });
    Toast.show('PDF rearranged successfully!', 'success');
}
