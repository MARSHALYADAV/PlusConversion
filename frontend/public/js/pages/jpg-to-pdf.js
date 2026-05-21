import { applyPageIcons } from '../utils/pageIcons.js';
/**
 * JPG TO PDF PAGE SCRIPT
 */
import { initNavbar }    from '../components/navbar.js';
import Toast             from '../components/toast.js';
import DropZone          from '../components/dropzone.js';
import ProgressUI        from '../components/progressUI.js';
import ResultCard        from '../components/resultCard.js';
import FileList          from '../components/fileList.js';
import { imagesToPdf }   from '../modules/apiClient.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar('jpg-to-pdf');
    applyPageIcons();

    const ui = new ProgressUI({
        uploadSection:     document.getElementById('upload-section'),
        processingSection: document.getElementById('processing-section'),
        resultSection:     document.getElementById('result-section'),
        progressFill:      document.getElementById('progress-fill'),
        processingText:    document.getElementById('processing-text'),
    });

    const fileList = new FileList({
        containerEl: document.getElementById('file-list'),
        allowReorder: true,
        onUpdate: (files) => {
            const btn = document.getElementById('submit-btn');
            if (btn) btn.disabled = files.length === 0;

            const hint = document.getElementById('file-count-hint');
            if (hint) {
                hint.textContent = files.length === 0
                    ? 'Add images to convert'
                    : `${files.length} image${files.length > 1 ? 's' : ''} ready`;
                hint.style.color = files.length > 0 ? 'var(--success)' : 'var(--text-muted)';
            }
        }
    });

    const rc = new ResultCard({
        containerEl: document.getElementById('result-section'),
        onReset: () => { fileList.clear(); ui.reset(); }
    });

    new DropZone({
        containerEl: document.getElementById('drop-zone'),
        inputEl:     document.getElementById('file-input'),
        browseBtn:   document.getElementById('browse-btn'),
        accept:      ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'],
        multiple:    true,
        maxSizeMb:   50,
        onFiles: (files) => fileList.add(files)
    });

    document.getElementById('submit-btn')?.addEventListener('click', async () => {
        const files = fileList.getFiles();
        if (files.length === 0) { Toast.show('Please add at least one image.', 'warning'); return; }

        ui.showProcessing(`Converting ${files.length} image${files.length > 1 ? 's' : ''} to PDF…`);

        try {
            const data = await imagesToPdf(files);
            rc.show(data);
            ui.showResult();
            Toast.show('Images converted to PDF!', 'success');
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
