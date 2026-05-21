/**
 * COMPRESS PDF PAGE SCRIPT
 */
import { initNavbar }   from '../components/navbar.js';
import Toast            from '../components/toast.js';
import DropZone         from '../components/dropzone.js';
import ProgressUI       from '../components/progressUI.js';
import ResultCard       from '../components/resultCard.js';
import FileList         from '../components/fileList.js';
import { compressPdf }  from '../modules/apiClient.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar('compress-pdf');

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

    // Compression mode card selection
    let selectedMode = 'recommended';
    document.querySelectorAll('.compression-mode-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.compression-mode-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedMode = card.dataset.mode;
        });
    });

    document.getElementById('submit-btn')?.addEventListener('click', async () => {
        if (!selectedFile) { Toast.show('Please select a PDF file first.', 'warning'); return; }

        const modeLabels = { low: 'Light', recommended: 'Recommended', extreme: 'Extreme' };
        ui.showProcessing(`Compressing PDF (${modeLabels[selectedMode] || selectedMode} mode)…`);

        try {
            const data = await compressPdf(selectedFile, selectedMode);
            rc.show({ ...data, originalSize: selectedFile.size });
            ui.showResult();
            Toast.show('PDF compressed successfully!', 'success');
        } catch (err) {
            ui.reset();
            Toast.show(err.message || 'Compression failed. Please try again.', 'error');
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
