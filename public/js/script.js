document.addEventListener('DOMContentLoaded', () => {
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

    // Conversion Logic
    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        setLoading(true);

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('images', file);
        });

        formData.append('format', formatSelect.value);
        formData.append('quality', qualityRange.value);
        if (widthInput.value) formData.append('width', widthInput.value);
        if (heightInput.value) formData.append('height', heightInput.value);
        formData.append('maintainAspect', maintainAspectCheckbox.checked);

        // Target Size Logic
        if (targetSizeInput.value) {
            const size = parseFloat(targetSizeInput.value);
            const multiplier = sizeUnit.value === 'MB' ? 1024 * 1024 : 1024;
            const targetSizeBytes = Math.floor(size * multiplier);
            formData.append('targetSize', targetSizeBytes);
        }

        // Advanced Options
        formData.append('keepMetadata', keepMetadataCheckbox.checked);
        formData.append('useTransparency', useTransparencyCheckbox.checked);
        formData.append('backgroundColor', bgColorInput.value);

        try {
            // Simulated progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5;
                if (progress > 90) clearInterval(progressInterval);
                progressFill.style.width = `${progress}%`;
            }, 300);

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

            // Determine filename based on content type
            const contentType = response.headers.get('content-type');
            let filename = `converted.${formatSelect.value}`;

            if (contentType.includes('zip')) {
                filename = 'converted_images.zip';
            } else {
                // Try to get from header or default
                const disposition = response.headers.get('content-disposition');
                if (disposition && disposition.indexOf('attachment') !== -1) {
                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    const matches = filenameRegex.exec(disposition);
                    if (matches != null && matches[1]) {
                        filename = matches[1].replace(/['"]/g, '');
                    }
                }
            }

            downloadFile(blob, filename);

            statusMsg.textContent = 'Conversion successful! Downloading...';
            setTimeout(() => {
                statusMsg.textContent = '';
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
    function handleFiles(files) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp', 'image/heic'];
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

            // Handle HEIC preview
            // HEIC files might have type 'image/heic' or just '' with name ending in .heic
            const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic');

            if (isHeic) {
                // Placeholder
                img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTA5MGI5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01ek0yIDE3bDEwIDUgMTAtNU0yIDEybDEwIDUgMTAtNSIvPjwvc3ZnPg==';
                img.style.opacity = '0.5';

                // Fetch preview
                const formData = new FormData();
                formData.append('image', file);

                fetch('/api/preview', { method: 'POST', body: formData })
                    .then(res => {
                        if (!res.ok) throw new Error('Preview failed');
                        return res.blob();
                    })
                    .then(blob => {
                        img.src = URL.createObjectURL(blob);
                        img.onload = () => {
                            img.style.opacity = '1';
                        };
                    })
                    .catch(e => {
                        console.error('Preview error', e);
                        // Convert placeholder to error state if needed
                        img.style.border = '2px solid red';
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
            removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            removeBtn.onclick = () => removeFile(index);

            fileItem.appendChild(img);
            fileItem.appendChild(info);
            fileItem.appendChild(removeBtn);
            fileListContainer.appendChild(fileItem);
        });

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

    function downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
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
