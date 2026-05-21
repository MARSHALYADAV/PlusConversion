/**
 * MERGE PDF PAGE SCRIPT
 */
import { initNavbar }   from '../components/navbar.js';
import Toast            from '../components/toast.js';
import DropZone         from '../components/dropzone.js';
import ProgressUI       from '../components/progressUI.js';
import ResultCard       from '../components/resultCard.js';
import FileList         from '../components/fileList.js';
import { mergePdfs }    from '../modules/apiClient.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar('merge-pdf');

    const ui = new ProgressUI({
        uploadSection:     document.getElementById('upload-section'),
        processingSection: document.getElementById('processing-section'),
        resultSection:     document.getElementById('result-section'),
        progressFill:      document.getElementById('progress-fill'),
        processingText:    document.getElementById('processing-text'),
    });

    const rc = new ResultCard({
        containerEl: document.getElementById('result-section'),
        onReset: () => { fileList.clear(); ui.reset(); }
    });

    const fileList = new FileList({
        containerEl: document.getElementById('file-list'),
        allowReorder: true,
        onUpdate: (files) => {
            const btn = document.getElementById('submit-btn');
            if (btn) btn.disabled = files.length < 2;

            const hint = document.getElementById('file-count-hint');
            if (hint) {
                hint.textContent = files.length < 2
                    ? 'Add at least 2 PDF files to merge'
                    : `${files.length} file${files.length > 1 ? 's' : ''} ready to merge`;
                hint.style.color = files.length >= 2 ? 'var(--success)' : 'var(--text-muted)';
            }
        }
    });

    new DropZone({
        containerEl: document.getElementById('drop-zone'),
        inputEl:     document.getElementById('file-input'),
        browseBtn:   document.getElementById('browse-btn'),
        accept:      ['.pdf'],
        multiple:    true,
        maxSizeMb:   200,
        onFiles:     (files) => fileList.add(files)
    });

    document.getElementById('submit-btn')?.addEventListener('click', async () => {
        const files = fileList.getFiles();
        if (files.length < 2) {
            Toast.show('Please add at least 2 PDF files to merge.', 'warning');
            return;
        }

        ui.showProcessing(`Merging ${files.length} PDFs…`);

        try {
            const data = await mergePdfs(files);
            rc.show(data);
            ui.showResult();
            Toast.show('PDFs merged successfully!', 'success');
        } catch (err) {
            ui.reset();
            Toast.show(err.message || 'Merge failed. Please try again.', 'error');
        }
    });

    // FAQ accordion
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
