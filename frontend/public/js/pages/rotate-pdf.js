import { applyPageIcons } from '../utils/pageIcons.js';
/**
 * ROTATE PDF PAGE SCRIPT
 */
import { initNavbar }   from '../components/navbar.js';
import Toast            from '../components/toast.js';
import DropZone         from '../components/dropzone.js';
import ProgressUI       from '../components/progressUI.js';
import ResultCard       from '../components/resultCard.js';
import FileList         from '../components/fileList.js';
import { rotatePdf }    from '../modules/apiClient.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar('rotate-pdf');
    applyPageIcons();

    const ui = new ProgressUI({
        uploadSection:     document.getElementById('upload-section'),
        processingSection: document.getElementById('processing-section'),
        resultSection:     document.getElementById('result-section'),
        progressFill:      document.getElementById('progress-fill'),
        processingText:    document.getElementById('processing-text'),
    });

    let selectedFile = null;
    let selectedAngle = 90;

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

    // Rotation angle selection
    document.querySelectorAll('.rotation-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.rotation-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedAngle = parseInt(opt.dataset.angle) || 90;
        });
    });

    document.getElementById('submit-btn')?.addEventListener('click', async () => {
        if (!selectedFile) { Toast.show('Please select a PDF file first.', 'warning'); return; }

        ui.showProcessing(`Rotating PDF by ${selectedAngle}°…`);

        try {
            const data = await rotatePdf(selectedFile, selectedAngle);
            rc.show(data);
            ui.showResult();
            Toast.show('PDF rotated successfully!', 'success');
        } catch (err) {
            ui.reset();
            Toast.show(err.message || 'Rotation failed. Please try again.', 'error');
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
