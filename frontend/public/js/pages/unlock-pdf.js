import { applyPageIcons } from '../utils/pageIcons.js';
import { initNavbar }   from '../components/navbar.js';
import Toast            from '../components/toast.js';
import DropZone         from '../components/dropzone.js';
import ProgressUI       from '../components/progressUI.js';
import ResultCard       from '../components/resultCard.js';
import FileList         from '../components/fileList.js';
import { unlockPdf }    from '../modules/apiClient.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar('unlock-pdf');
    applyPageIcons();

    const ui = new ProgressUI({
        uploadSection:     document.getElementById('upload-section'),
        processingSection: document.getElementById('processing-section'),
        resultSection:     document.getElementById('result-section'),
        progressFill:      document.getElementById('progress-fill'),
        processingText:    document.getElementById('processing-text'),
    });

    let selectedFile = null;

    const passwordContainer = document.getElementById('password-container');
    const passwordInput = document.getElementById('pdf-password');
    const submitBtn = document.getElementById('submit-btn');

    const fileList = new FileList({
        containerEl: document.getElementById('file-list'),
        onUpdate: (files) => {
            selectedFile = files[0] || null;
            if (selectedFile) {
                submitBtn.disabled = false;
                passwordContainer.classList.remove('hidden');
                passwordInput.value = '';
                passwordInput.classList.remove('error-field');
                passwordInput.focus();
            } else {
                submitBtn.disabled = true;
                passwordContainer.classList.add('hidden');
                passwordInput.value = '';
                passwordInput.classList.remove('error-field');
            }
        }
    });

    const rc = new ResultCard({
        containerEl: document.getElementById('result-section'),
        onReset: () => {
            fileList.clear();
            selectedFile = null;
            passwordInput.value = '';
            passwordInput.classList.remove('error-field');
            ui.reset();
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

    // Password Toggle visibility
    const togglePasswordBtn = document.getElementById('toggle-password-btn');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            const eyeIcon = togglePasswordBtn.querySelector('i');
            if (eyeIcon) {
                if (isPassword) {
                    eyeIcon.setAttribute('data-lucide', 'eye-off');
                } else {
                    eyeIcon.setAttribute('data-lucide', 'eye');
                }
                // Re-apply Lucide icons to render the new icon
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }
        });
    }

    submitBtn?.addEventListener('click', async () => {
        if (!selectedFile) {
            Toast.show('Please select a PDF file first.', 'warning');
            return;
        }

        const password = passwordInput.value.trim();
        ui.showProcessing('Decrypting PDF and removing protection…');
        passwordInput.classList.remove('error-field');

        try {
            const data = await unlockPdf(selectedFile, password);
            rc.show(data);
            ui.showResult();
            Toast.show('PDF unlocked successfully!', 'success');
        } catch (err) {
            ui.reset();
            const errMsg = err.message || '';
            
            if (errMsg.includes('password') || errMsg.includes('Password') || errMsg.includes('Incorrect') || errMsg.includes('decrypt')) {
                passwordInput.classList.add('error-field');
                passwordInput.focus();
                Toast.show('Incorrect password. Please try again.', 'error');
            } else {
                Toast.show(errMsg || 'Failed to unlock PDF. Please verify and try again.', 'error');
            }
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
