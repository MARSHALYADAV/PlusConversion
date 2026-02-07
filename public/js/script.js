document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const uploadSection = document.getElementById('upload-section');
    const optionsSection = document.getElementById('options-section');

    const imagePreview = document.getElementById('image-preview');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const removeBtn = document.getElementById('remove-btn');

    const convertBtn = document.getElementById('convert-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.querySelector('.progress-fill');
    const statusMsg = document.getElementById('status-msg');

    const formatSelect = document.getElementById('format-select');
    const qualityRange = document.getElementById('quality-range');
    const qualityValue = document.getElementById('quality-value');
    const widthInput = document.getElementById('width-input');
    const heightInput = document.getElementById('height-input');
    const maintainAspectCheckbox = document.getElementById('maintain-aspect');

    // State
    let currentFile = null;

    // Event Listeners for Upload
    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    removeBtn.addEventListener('click', resetUI);

    // Settings Logic
    qualityRange.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
    });

    // Conversion Logic
    convertBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        setLoading(true);

        const formData = new FormData();
        formData.append('image', currentFile);
        formData.append('format', formatSelect.value);
        formData.append('quality', qualityRange.value);
        if (widthInput.value) formData.append('width', widthInput.value);
        if (heightInput.value) formData.append('height', heightInput.value);
        formData.append('maintainAspect', maintainAspectCheckbox.checked);

        try {
            // Simulated progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 10;
                if (progress > 90) clearInterval(progressInterval);
                progressFill.style.width = `${progress}%`;
            }, 200);

            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);
            progressFill.style.width = '100%';

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Conversion failed');
            }

            const blob = await response.blob();
            downloadFile(blob, `converted.${formatSelect.value}`);

            statusMsg.textContent = 'Conversion successful! Downloading...';
            setTimeout(() => {
                statusMsg.textContent = '';
                // Optional: resetUI(); // Keeping UI for re-conversion if desired
            }, 3000);

        } catch (error) {
            console.error(error);
            statusMsg.textContent = `Error: ${error.message}`;
            statusMsg.style.color = '#ef4444';
        } finally {
            setLoading(false);
        }
    });

    // Helper Functions
    function handleFile(file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
        // Note: checking mime type might be strict, let's also allow if not perfectly matched but is image
        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file.');
            return;
        }

        currentFile = file;

        // UI Update
        uploadSection.classList.add('hidden');
        optionsSection.classList.remove('hidden');

        // File Info
        fileName.textContent = file.name;
        fileSize.textContent = formatBytes(file.size);

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);

        // Reset inputs
        widthInput.value = '';
        heightInput.value = '';
        progressFill.style.width = '0%';
        statusMsg.textContent = '';
    }

    function resetUI() {
        currentFile = null;
        fileInput.value = ''; // Reset input to allow re-selecting same file
        uploadSection.classList.remove('hidden');
        optionsSection.classList.add('hidden');
    }

    function setLoading(isLoading) {
        convertBtn.disabled = isLoading;
        if (isLoading) {
            progressBar.classList.remove('hidden');
            convertBtn.textContent = 'Converting...';
        } else {
            // Keep button text as converted or reset? Let's reset after delay or keep as is.
            convertBtn.textContent = 'Convert & Download';
            // Don't hide progress immediately so user sees 100%
        }
    }

    function downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; // The server also sends Content-Disposition, but this enforces it in browser
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});
