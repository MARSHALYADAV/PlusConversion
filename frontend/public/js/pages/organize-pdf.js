import { applyPageIcons } from '../utils/pageIcons.js';
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
        mode: 'organize',
        onProcess: async (pagesToKeep) => {
            pageSorter.hide();
            progressUI.show('Processing organized PDF...');
            try {
                await executeOrganize(currentArrayBuffer, pagesToKeep, originalFilename, progressUI, resultCard);
            } catch (err) {
                console.error(err);
                progressUI.hide();
                pageSorter.show();
                Toast.show('Failed to organize PDF: ' + err.message, 'error');
            }
        }
    });

    const dropZone = new DropZone('dropzone-container', {
        accept: '.pdf',
        multiple: false,
        title: 'Upload PDF to organize',
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

async function executeOrganize(arrayBuffer, pagesToKeep, filename, progressUI, resultCard) {
    progressUI.update('Loading PDF binary...', 20);
    const { PDFDocument, degrees } = PDFLib;

    const originalDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    
    progressUI.update('Creating organized document...', 50);
    const newDoc = await PDFDocument.create();

    const indices = pagesToKeep.map(p => p.index);
    const copiedPages = await newDoc.copyPages(originalDoc, indices);

    copiedPages.forEach((page, i) => {
        const rotationAngle = pagesToKeep[i].rotation;
        if (rotationAngle !== 0) {
            const currentRotation = page.getRotation().angle;
            // PDFLib expects degrees (e.g. degrees(90))
            page.setRotation(degrees((currentRotation + rotationAngle) % 360));
        }
        newDoc.addPage(page);
    });

    progressUI.update('Saving PDF...', 80);
    const pdfBytes = await newDoc.save();

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const outFilename = filename.replace(/\.pdf$/i, '_organized.pdf');

    progressUI.hide();
    resultCard.show({
        filename: outFilename,
        size: blob.size,
        downloadUrl: downloadUrl
    });
    Toast.show('PDF organized successfully!', 'success');
}
