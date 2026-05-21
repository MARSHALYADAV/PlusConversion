import { applyPageIcons } from '../utils/pageIcons.js';
/**
 * WATERMARK PDF PAGE SCRIPT
 */
import { initNavbar }    from '../components/navbar.js';
import Toast             from '../components/toast.js';
import DropZone          from '../components/dropzone.js';
import ProgressUI        from '../components/progressUI.js';
import ResultCard        from '../components/resultCard.js';
import FileList          from '../components/fileList.js';
import { watermarkPdf }  from '../modules/apiClient.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar('watermark-pdf');
    applyPageIcons();

    const ui = new ProgressUI({
        uploadSection:     document.getElementById('upload-section'),
        processingSection: document.getElementById('processing-section'),
        resultSection:     document.getElementById('result-section'),
        progressFill:      document.getElementById('progress-fill'),
        processingText:    document.getElementById('processing-text'),
    });

    let selectedFile = null;

    const fileList = new FileList({
        containerEl: document.getElementById('file-list'),
        onUpdate: (files) => {
            selectedFile = files[0] || null;
            const btn = document.getElementById('submit-btn');
            if (btn) btn.disabled = !selectedFile;
        }
    });

    const rc = new ResultCard({
        containerEl: document.getElementById('result-section'),
        onReset: () => { fileList.clear(); selectedFile = null; ui.reset(); }
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

    // Live watermark text preview
    const textInput   = document.getElementById('watermark-text');
    const previewEl   = document.getElementById('watermark-preview');
    const opacityEl   = document.getElementById('opacity-range');
    const opacityVal  = document.getElementById('opacity-value');
    const sizeEl      = document.getElementById('font-size');
    const colorEl     = document.getElementById('watermark-color');

    function updatePreview() {
        if (!previewEl) return;
        const text    = textInput?.value || 'CONFIDENTIAL';
        const opacity = opacityEl?.value  || 40;
        const size    = Math.min(Math.max(parseInt(sizeEl?.value) || 50, 12), 72);
        const color   = colorEl?.value    || '#cccccc';

        previewEl.textContent  = text;
        previewEl.style.opacity    = opacity / 100;
        previewEl.style.fontSize   = `${size}px`;
        previewEl.style.color      = color;
        previewEl.style.transform  = 'rotate(-45deg)';
    }

    [textInput, opacityEl, sizeEl, colorEl].forEach(el => {
        if (el) el.addEventListener('input', updatePreview);
    });

    if (opacityEl && opacityVal) {
        opacityEl.addEventListener('input', () => { opacityVal.textContent = opacityEl.value; });
    }

    updatePreview();

    document.getElementById('submit-btn')?.addEventListener('click', async () => {
        if (!selectedFile) { Toast.show('Please select a PDF file first.', 'warning'); return; }

        const text = textInput?.value?.trim();
        if (!text) { Toast.show('Please enter watermark text.', 'warning'); return; }

        ui.showProcessing('Adding watermark…');

        try {
            const data = await watermarkPdf(selectedFile, text, {
                size:     parseInt(sizeEl?.value)    || 50,
                color:    colorEl?.value             || '#cccccc',
                opacity:  (parseInt(opacityEl?.value) || 40) / 100,
                rotation: -45
            });
            rc.show(data);
            ui.showResult();
            Toast.show('Watermark added!', 'success');
        } catch (err) {
            ui.reset();
            Toast.show(err.message || 'Watermark failed. Please try again.', 'error');
        }
    });

    initFaq();
});

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
