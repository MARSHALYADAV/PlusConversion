import { applyPageIcons } from '../utils/pageIcons.js';
import { initNavbar }   from '../components/navbar.js';
import Toast            from '../components/toast.js';
import DropZone         from '../components/dropzone.js';
import ProgressUI       from '../components/progressUI.js';
import ResultCard       from '../components/resultCard.js';
import FileList         from '../components/fileList.js';
import { convertOfficeToPdf } from '../modules/apiClient.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar('word-to-pdf');
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
        accept:      ['.docx', '.doc'],
        multiple:    false,
        maxSizeMb:   50,
        onFiles: (files) => fileList.set(files)
    });

    document.getElementById('submit-btn')?.addEventListener('click', async () => {
        if (!selectedFile) { Toast.show('Please select a Word document first.', 'warning'); return; }

        ui.showProcessing('Converting Word document to PDF…');

        try {
            const data = await convertOfficeToPdf(selectedFile, 'word');
            rc.show(data);
            ui.showResult();
            Toast.show('Document converted successfully!', 'success');
        } catch (err) {
            ui.reset();
            Toast.show(err.message || 'Conversion failed. Please try again.', 'error');
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
