import { applyPageIcons } from '../utils/pageIcons.js';
import { initNavbar } from '../components/navbar.js';
import Toast from '../components/toast.js';
import DropZone from '../components/dropzone.js';
import ProgressUI from '../components/progressUI.js';
import ResultCard from '../components/resultCard.js';
import FileList from '../components/fileList.js';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar('pdf-to-jpg');
    applyPageIcons();

    const ui = new ProgressUI({
        uploadSection:     document.getElementById('upload-section'),
        processingSection: document.getElementById('processing-section'),
        resultSection:     document.getElementById('result-section'),
        progressFill:      document.getElementById('progress-fill'),
        processingText:    document.getElementById('processing-text'),
    });

    let selectedFile = null;
    let pdfDoc = null;
    let selectedQuality = 'medium';

    const fileList = new FileList({
        containerEl: document.getElementById('file-list'),
        onUpdate: (files) => {
            selectedFile = files[0] || null;
            const btn = document.getElementById('submit-btn');
            if (btn) btn.disabled = !selectedFile;
            
            if (selectedFile) {
                renderPdfPreviews(selectedFile);
            } else {
                hidePreviews();
            }
        }
    });

    const rc = new ResultCard({
        containerEl: document.getElementById('result-section'),
        onReset: () => {
            fileList.clear();
            selectedFile = null;
            pdfDoc = null;
            ui.reset();
            hidePreviews();
        }
    });

    new DropZone({
        containerEl: document.getElementById('drop-zone'),
        inputEl:     document.getElementById('file-input'),
        browseBtn:   document.getElementById('browse-btn'),
        accept:      ['.pdf'],
        multiple:    false,
        maxSizeMb:   200,
        onFiles: (files) => fileList.set(files)
    });

    // Quality card selection
    document.querySelectorAll('.quality-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.quality-card').forEach(c => {
                c.classList.remove('selected');
                c.setAttribute('aria-checked', 'false');
            });
            card.classList.add('selected');
            card.setAttribute('aria-checked', 'true');
            selectedQuality = card.dataset.quality;
        });

        // Key support for accessibility
        card.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                card.click();
            }
        });
    });

    // Handle extraction
    document.getElementById('submit-btn')?.addEventListener('click', async () => {
        if (!selectedFile) {
            Toast.show('Please select a PDF file first.', 'warning');
            return;
        }

        ui.showProcessing('Rendering PDF pages to images…');
        
        try {
            await extractPdfPages(selectedFile, selectedQuality, ui, rc);
            ui.showResult();
        } catch (err) {
            ui.reset();
            Toast.show(err.message || 'Conversion failed. Please try again.', 'error');
        }
    });

    initFaq();
});

/**
 * Renders thumbnail previews for all pages in the PDF file
 */
async function renderPdfPreviews(file) {
    const galleryContainer = document.getElementById('preview-gallery');
    const grid = document.getElementById('gallery-grid');
    const countDisplay = document.getElementById('page-count-display');

    if (!galleryContainer || !grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; padding: 1.5rem; text-align: center; color: var(--text-secondary);"><div class="spinner" style="width:24px;height:24px;margin:0 auto 0.5rem;"></div>Loading previews...</div>';
    galleryContainer.classList.remove('hidden');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        countDisplay.textContent = `${pdf.numPages} ${pdf.numPages === 1 ? 'page' : 'pages'}`;
        grid.innerHTML = '';

        const maxPreviews = Math.min(pdf.numPages, 100); // Caps rendering at 100 previews to prevent browser lag on huge files

        for (let i = 1; i <= maxPreviews; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.25 });

            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            const imgContainer = document.createElement('div');
            imgContainer.className = 'gallery-img-container';
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            imgContainer.appendChild(canvas);
            
            const label = document.createElement('div');
            label.className = 'gallery-page-label';
            label.textContent = `Page ${i}`;

            item.appendChild(imgContainer);
            item.appendChild(label);
            grid.appendChild(item);

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
        }

        if (pdf.numPages > 100) {
            const warning = document.createElement('div');
            warning.style.gridColumn = '1/-1';
            warning.style.padding = '0.75rem';
            warning.style.textAlign = 'center';
            warning.style.fontSize = '0.8rem';
            warning.style.color = 'var(--text-secondary)';
            warning.textContent = `Previews capped at 100. Remaining ${pdf.numPages - 100} pages will be fully converted.`;
            grid.appendChild(warning);
        }

    } catch (err) {
        console.error('Preview error:', err);
        grid.innerHTML = `<div style="grid-column:1/-1;color:var(--danger);padding:1rem;text-align:center;">Could not generate page previews: ${err.message}</div>`;
    }
}

/**
 * Hides the preview panel
 */
function hidePreviews() {
    const galleryContainer = document.getElementById('preview-gallery');
    const grid = document.getElementById('gallery-grid');
    if (galleryContainer) galleryContainer.classList.add('hidden');
    if (grid) grid.innerHTML = '';
}

/**
 * Performs high quality conversion of PDF pages and zips the results
 */
async function extractPdfPages(file, quality, ui, rc) {
    const scaleMap = { low: 1.0, medium: 1.8, high: 3.0 };
    const scale = scaleMap[quality] || 1.8;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    const zip = new JSZip();
    let singleBlob = null;

    for (let i = 1; i <= numPages; i++) {
        const percent = Math.floor((i / numPages) * 90);
        ui.updateProcessing(`Rasterising page ${i} of ${numPages}…`, percent);

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));

        if (numPages === 1) {
            singleBlob = blob;
        } else {
            const padLen = Math.max(2, numPages.toString().length);
            const pageNum = i.toString().padStart(padLen, '0');
            zip.file(`page_${pageNum}.jpg`, blob);
        }
    }

    ui.updateProcessing('Finalising packaging…', 95);

    let downloadUrl;
    let filename;
    let sizeBytes;

    if (numPages === 1) {
        downloadUrl = URL.createObjectURL(singleBlob);
        filename = file.name.replace(/\.pdf$/i, '.jpg');
        sizeBytes = singleBlob.size;
    } else {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadUrl = URL.createObjectURL(zipBlob);
        filename = file.name.replace(/\.pdf$/i, '_extracted_pages.zip');
        sizeBytes = zipBlob.size;
    }

    rc.show({
        downloadUrl,
        filename,
        size: sizeBytes
    });

    Toast.show('PDF pages extracted successfully!', 'success');
}

function initFaq() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });
}
