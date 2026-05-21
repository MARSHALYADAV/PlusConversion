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
    
    let currentArrayBuffer = null;
    let originalFilename = '';
    let pdfDocJs = null; // PDF.js document representation instance
    let currentPageNum = 1;
    let totalPages = 1;

    // Elements
    const workspace = document.getElementById('crop-workspace-container');
    const canvas = document.getElementById('crop-preview-canvas');
    const cropWrapper = document.getElementById('crop-wrapper');
    const cropSelection = document.getElementById('crop-selection-box');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageNumDisplay = document.getElementById('page-num-display');
    const aspectSelect = document.getElementById('aspect-ratio-select');
    const cropGenerateBtn = document.getElementById('crop-generate-btn');

    // Interactive Crop State variables
    let isDragging = false;
    let dragType = ''; // 'move' or 'tl', 'tr', 'bl', 'br'
    let startX = 0, startY = 0;
    let startL = 0, startT = 0, startW = 0, startH = 0;

    const dropZone = new DropZone('dropzone-container', {
        accept: '.pdf',
        multiple: false,
        title: 'Upload PDF to crop',
        subtitle: 'or drag and drop here',
        onFilesSelected: async (files) => {
            const file = files[0];
            if (!file) return;

            originalFilename = file.name;
            dropZone.hide();
            progressUI.show('Parsing PDF...');
            
            try {
                currentArrayBuffer = await file.arrayBuffer();
                pdfDocJs = await pdfjsLib.getDocument({ data: currentArrayBuffer }).promise;
                totalPages = pdfDocJs.numPages;
                currentPageNum = 1;

                progressUI.hide();
                workspace.classList.remove('hidden');
                
                await renderPreviewPage(currentPageNum);
                initCropBox();
                updateNavigation();
            } catch (err) {
                console.error(err);
                progressUI.hide();
                dropZone.show();
                Toast.show('Failed to read PDF: ' + err.message, 'error');
            }
        }
    });

    async function renderPreviewPage(pageNum) {
        if (!pdfDocJs) return;
        try {
            const page = await pdfDocJs.getPage(pageNum);
            
            // Render at suitable scale for visual container
            const viewport = page.getViewport({ scale: 1.0 });
            const containerWidth = document.querySelector('.crop-visual-area').clientWidth - 40;
            const containerHeight = 450;
            
            const scale = Math.min(containerWidth / viewport.width, containerHeight / viewport.height, 1.2);
            const scaledViewport = page.getViewport({ scale });

            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            const context = canvas.getContext('2d');
            await page.render({
                canvasContext: context,
                viewport: scaledViewport
            }).promise;

            // Set wrapper size to match canvas precisely
            cropWrapper.style.width = canvas.width + 'px';
            cropWrapper.style.height = canvas.height + 'px';
        } catch (err) {
            console.error('Render page error:', err);
            Toast.show('Error rendering page preview', 'error');
        }
    }

    function initCropBox() {
        const cw = canvas.width;
        const ch = canvas.height;
        // Initial crop box at 80% centered
        const w = Math.round(cw * 0.8);
        const h = Math.round(ch * 0.8);
        const l = Math.round((cw - w) / 2);
        const t = Math.round((ch - h) / 2);

        applyCropBoxStyles(l, t, w, h);
    }

    function applyCropBoxStyles(l, t, w, h) {
        cropSelection.style.left = l + 'px';
        cropSelection.style.top = t + 'px';
        cropSelection.style.width = w + 'px';
        cropSelection.style.height = h + 'px';
    }

    function getCropBoxBounds() {
        return {
            left: parseInt(cropSelection.style.left) || 0,
            top: parseInt(cropSelection.style.top) || 0,
            width: parseInt(cropSelection.style.width) || 0,
            height: parseInt(cropSelection.style.height) || 0
        };
    }

    // Aspect Ratio updates
    aspectSelect.addEventListener('change', () => {
        const ratio = getSelectedRatio();
        if (ratio) {
            const bounds = getCropBoxBounds();
            let newW = bounds.width;
            let newH = Math.round(newW / ratio);

            if (newH > canvas.height) {
                newH = canvas.height;
                newW = Math.round(newH * ratio);
            }

            // Ensure within boundaries
            let newL = Math.max(0, Math.min(bounds.left, canvas.width - newW));
            let newT = Math.max(0, Math.min(bounds.top, canvas.height - newH));

            applyCropBoxStyles(newL, newT, newW, newH);
        }
    });

    function getSelectedRatio() {
        const val = aspectSelect.value;
        if (val === '1:1') return 1.0;
        if (val === '4:3') return 4 / 3;
        if (val === '16:9') return 16 / 9;
        if (val === 'a4') return 1 / 1.414; // A4 portrait ratio
        return null; // Free selection
    }

    // Drag handlers
    cropSelection.addEventListener('mousedown', startDrag);
    cropSelection.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
        e.preventDefault();
        isDragging = true;
        
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;

        const bounds = getCropBoxBounds();
        startL = bounds.left;
        startT = bounds.top;
        startW = bounds.width;
        startH = bounds.height;

        const handle = e.target.closest('.crop-handle');
        if (handle) {
            dragType = handle.dataset.handle;
        } else {
            dragType = 'move';
        }

        window.addEventListener('mousemove', onDrag);
        window.addEventListener('touchmove', onDrag, { passive: false });
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);
    }

    function onDrag(e) {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();

        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;

        const cw = canvas.width;
        const ch = canvas.height;
        const ratio = getSelectedRatio();

        let l = startL, t = startT, w = startW, h = startH;

        if (dragType === 'move') {
            l = Math.max(0, Math.min(startL + dx, cw - w));
            t = Math.max(0, Math.min(startT + dy, ch - h));
        } else {
            // Corner Resize
            if (dragType === 'br') {
                w = Math.max(30, Math.min(startW + dx, cw - startL));
                if (ratio) {
                    h = Math.round(w / ratio);
                    if (h > ch - startT) {
                        h = ch - startT;
                        w = Math.round(h * ratio);
                    }
                } else {
                    h = Math.max(30, Math.min(startH + dy, ch - startT));
                }
            } else if (dragType === 'bl') {
                const maxDx = startL;
                const changeX = Math.max(-maxDx, dx);
                w = Math.max(30, startW - changeX);
                l = startL + (startW - w);

                if (ratio) {
                    h = Math.round(w / ratio);
                    if (h > ch - startT) {
                        h = ch - startT;
                        w = Math.round(h * ratio);
                        l = startL + (startW - w);
                    }
                } else {
                    h = Math.max(30, Math.min(startH + dy, ch - startT));
                }
            } else if (dragType === 'tr') {
                w = Math.max(30, Math.min(startW + dx, cw - startL));
                
                if (ratio) {
                    h = Math.round(w / ratio);
                    if (h > startT + startH) {
                        h = startT + startH;
                        w = Math.round(h * ratio);
                    }
                    t = startT + startH - h;
                } else {
                    const maxDy = startT;
                    const changeY = Math.max(-maxDy, dy);
                    h = Math.max(30, startH - changeY);
                    t = startT + (startH - h);
                }
            } else if (dragType === 'tl') {
                const maxDx = startL;
                const changeX = Math.max(-maxDx, dx);
                w = Math.max(30, startW - changeX);
                l = startL + (startW - w);

                if (ratio) {
                    h = Math.round(w / ratio);
                    if (h > startT + startH) {
                        h = startT + startH;
                        w = Math.round(h * ratio);
                        l = startL + (startW - w);
                    }
                    t = startT + startH - h;
                } else {
                    const maxDy = startT;
                    const changeY = Math.max(-maxDy, dy);
                    h = Math.max(30, startH - changeY);
                    t = startT + (startH - h);
                }
            }
        }

        applyCropBoxStyles(l, t, w, h);
    }

    function endDrag() {
        isDragging = false;
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('touchmove', onDrag);
        window.removeEventListener('mouseup', endDrag);
        window.removeEventListener('touchend', endDrag);
    }

    // Page navigation
    function updateNavigation() {
        pageNumDisplay.textContent = `Page ${currentPageNum} of ${totalPages}`;
        prevPageBtn.disabled = currentPageNum <= 1;
        nextPageBtn.disabled = currentPageNum >= totalPages;
    }

    prevPageBtn.addEventListener('click', async () => {
        if (currentPageNum > 1) {
            currentPageNum--;
            await renderPreviewPage(currentPageNum);
            initCropBox();
            updateNavigation();
        }
    });

    nextPageBtn.addEventListener('click', async () => {
        if (currentPageNum < totalPages) {
            currentPageNum++;
            await renderPreviewPage(currentPageNum);
            initCropBox();
            updateNavigation();
        }
    });

    // Execute Crop
    cropGenerateBtn.addEventListener('click', async () => {
        const applyRange = document.querySelector('input[name="crop-apply-range"]:checked').value;
        workspace.classList.add('hidden');
        progressUI.show('Cropping PDF...');

        try {
            await executeCrop(currentArrayBuffer, originalFilename, applyRange, progressUI, resultCard);
        } catch (err) {
            console.error(err);
            progressUI.hide();
            workspace.classList.remove('hidden');
            Toast.show('Failed to crop PDF: ' + err.message, 'error');
        }
    });

    async function executeCrop(arrayBuffer, filename, rangeMode, progressUI, resultCard) {
        progressUI.update('Loading PDF binary...', 20);
        const { PDFDocument } = PDFLib;

        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        
        // Translate visual box crop boundaries to PDF coordinates
        // We obtain the current preview page's viewport size at scale 1.0
        const pageIndexToPreview = currentPageNum - 1;
        const previewPage = pdfDoc.getPage(pageIndexToPreview);
        const originalWidth = previewPage.getWidth();
        const originalHeight = previewPage.getHeight();

        const canvasDisplayWidth = canvas.width;
        const canvasDisplayHeight = canvas.height;

        const scaleX = originalWidth / canvasDisplayWidth;
        const scaleY = originalHeight / canvasDisplayHeight;

        const bounds = getCropBoxBounds();

        // Calculate Y from bottom (origin in PDF coordinate system is bottom-left)
        const pdf_x = bounds.left * scaleX;
        const pdf_y = (canvasDisplayHeight - (bounds.top + bounds.height)) * scaleY;
        const pdf_w = bounds.width * scaleX;
        const pdf_h = bounds.height * scaleY;

        progressUI.update('Cropping pages...', 50);
        
        const pagesCount = pdfDoc.getPageCount();
        const targetIndices = [];

        if (rangeMode === 'all') {
            for (let i = 0; i < pagesCount; i++) {
                targetIndices.push(i);
            }
        } else {
            targetIndices.push(pageIndexToPreview);
        }

        targetIndices.forEach(idx => {
            const page = pdfDoc.getPage(idx);
            // PDF boxes: MediaBox define physical page size, CropBox defines printable area boundary
            page.setCropBox(pdf_x, pdf_y, pdf_w, pdf_h);
            page.setMediaBox(pdf_x, pdf_y, pdf_w, pdf_h);
        });

        progressUI.update('Saving cropped PDF...', 80);
        const pdfBytes = await pdfDoc.save();

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const outFilename = filename.replace(/\.pdf$/i, '_cropped.pdf');

        progressUI.hide();
        resultCard.show({
            filename: outFilename,
            size: blob.size,
            downloadUrl: downloadUrl
        });
        Toast.show('PDF cropped successfully!', 'success');
    }

    resultCard.onRestart(() => {
        resultCard.hide();
        currentArrayBuffer = null;
        pdfDocJs = null;
        dropZone.show();
    });
});
