import { fetchImagePreview, convertImages, triggerDownload, formatBytes } from './apiClient.js';

export function setupImageConverter() {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const uploadSection = document.getElementById('upload-section');
    const optionsSection = document.getElementById('options-section');
    const fileListContainer = document.getElementById('file-list');

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
    const targetSizeInput = document.getElementById('target-size-input');
    const sizeUnit = document.getElementById('size-unit');

    // Advanced Options
    const keepMetadataCheckbox = document.getElementById('keep-metadata');
    const useTransparencyCheckbox = document.getElementById('use-transparency');
    const bgColorWrapper = document.getElementById('bg-color-wrapper');
    const bgColorInput = document.getElementById('bg-color');

    if (!dropZone) return; // Prevent run on pages without converter

    // State
    let selectedFiles = [];

    // Event Listeners for Upload
    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
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
            handleFiles(e.dataTransfer.files);
        }
    });

    // Toggle transparency options logic
    useTransparencyCheckbox.addEventListener('change', () => {
        if (useTransparencyCheckbox.checked) {
            bgColorWrapper.style.display = 'block';
        } else {
            bgColorWrapper.style.display = 'none';
        }
    });

    // Settings Logic
    qualityRange.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
    });

    // Helper Functions
    function handleFiles(files) {
        const newFiles = Array.from(files).filter(file => file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic'));

        if (newFiles.length === 0) {
            alert('Please upload valid image files.');
            return;
        }

        selectedFiles = [...selectedFiles, ...newFiles];
        renderFileList();

        // UI Update
        uploadSection.classList.add('hidden');
        optionsSection.classList.remove('hidden');
    }

    function renderFileList() {
        fileListContainer.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            const img = document.createElement('img');
            img.className = 'file-thumb';

            const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic');

            if (isHeic) {
                img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTA5MGI5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01ek0yIDE3bDEwIDUgMTAtNU0yIDEybDEwIDUgMTAtNSIvPjwvc3ZnPg==';
                img.style.opacity = '0.5';

                fetchImagePreview(file)
                    .then(blob => {
                        img.src = URL.createObjectURL(blob);
                        img.onload = () => {
                            img.style.opacity = '1';
                        };
                    })
                    .catch(e => {
                        console.error('HEIC preview loading failed:', e);
                        img.style.opacity = '1';
                        img.style.border = '2px solid #ef4444';
                        img.title = 'Preview failed. File might be corrupted or unsupported.';
                    });
            } else {
                const reader = new FileReader();
                reader.onload = (e) => img.src = e.target.result;
                reader.readAsDataURL(file);
            }

            const info = document.createElement('div');
            info.className = 'file-info';
            info.innerHTML = `
                <span class="file-name" title="${file.name}">${file.name}</span>
                <span class="file-meta">${formatBytes(file.size)}</span>
            `;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '<i data-lucide="x"></i>';
            removeBtn.onclick = () => removeFile(index);

            fileItem.appendChild(img);
            fileItem.appendChild(info);
            fileItem.appendChild(removeBtn);
            fileListContainer.appendChild(fileItem);
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        if (selectedFiles.length === 0) {
            resetUI();
        }
    }

    function removeFile(index) {
        selectedFiles.splice(index, 1);
        renderFileList();
    }

    function resetUI() {
        selectedFiles = [];
        fileInput.value = '';
        uploadSection.classList.remove('hidden');
        optionsSection.classList.add('hidden');
        statusMsg.textContent = '';
        progressFill.style.width = '0%';
    }

    function setLoading(isLoading) {
        convertBtn.disabled = isLoading;
        if (isLoading) {
            progressBar.classList.remove('hidden');
            convertBtn.textContent = 'Converting...';
        } else {
            convertBtn.textContent = 'Convert & Download';
        }
    }

    // Conversion Submit Logic
    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        setLoading(true);

        const options = {
            format: formatSelect.value,
            quality: qualityRange.value,
            width: widthInput.value || null,
            height: heightInput.value || null,
            maintainAspect: maintainAspectCheckbox.checked,
            keepMetadata: keepMetadataCheckbox.checked,
            useTransparency: useTransparencyCheckbox.checked,
            backgroundColor: bgColorInput.value
        };

        if (targetSizeInput.value) {
            const size = parseFloat(targetSizeInput.value);
            const multiplier = sizeUnit.value === 'MB' ? 1024 * 1024 : 1024;
            options.targetSize = Math.floor(size * multiplier);
        }

        try {
            // Simulated progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5;
                if (progress > 90) clearInterval(progressInterval);
                progressFill.style.width = `${progress}%`;
            }, 300);

            const resData = await convertImages(selectedFiles, options);

            clearInterval(progressInterval);
            progressFill.style.width = '100%';

            if (resData.success && resData.downloadUrl) {
                triggerDownload(resData.downloadUrl, resData.filename);
                statusMsg.textContent = 'Conversion successful! Downloading...';
                statusMsg.style.color = '#10b981';
            } else {
                throw new Error(resData.error || 'Conversion failed');
            }

            setTimeout(() => {
                statusMsg.textContent = '';
            }, 3000);

        } catch (error) {
            console.error('Image Conversion Error:', error);
            statusMsg.textContent = `Error: ${error.message}`;
            statusMsg.style.color = '#ef4444';
        } finally {
            setLoading(false);
        }
    });
}
