/**
 * PlusConversion - Image Converter Page Module
 * Orchestrates image settings, thumbnail previews, and server REST conversion.
 */

import { initUploadZone } from '../components/uploadZone.js';
import { convertImages, fetchImagePreview, triggerDownload, formatBytes } from '../utils/apiClient.js';

export function setupImageConverter() {
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

    if (!uploadSection) return;

    // Toggle transparency options logic
    if (useTransparencyCheckbox && bgColorWrapper) {
        useTransparencyCheckbox.addEventListener('change', () => {
            bgColorWrapper.style.display = useTransparencyCheckbox.checked ? 'block' : 'none';
        });
    }

    // Settings Logic
    if (qualityRange && qualityValue) {
        qualityRange.addEventListener('input', (e) => {
            qualityValue.textContent = e.target.value;
        });
    }

    // Initialize custom modular upload zone
    const uploader = initUploadZone({
        dropZoneEl: document.getElementById('drop-zone'),
        fileInputEl: document.getElementById('file-input'),
        browseBtnEl: document.getElementById('browse-btn'),
        fileListEl: fileListContainer,
        multiple: true,
        maxSizeMB: 50,
        onFilesAdded: (added, allFiles) => {
            uploadSection.classList.add('hidden');
            optionsSection.classList.remove('hidden');
            loadThumbnails(allFiles);
        },
        onFileRemoved: (removed, index, allFiles) => {
            if (allFiles.length === 0) {
                resetUI();
            } else {
                loadThumbnails(allFiles);
            }
        }
    });

    if (!uploader) return;

    function resetUI() {
        uploader.clear();
        uploadSection.classList.remove('hidden');
        optionsSection.classList.add('hidden');
        statusMsg.textContent = '';
        if (progressFill) progressFill.style.width = '0%';
        if (progressBar) progressBar.classList.add('hidden');
    }

    // Dynamic thumbnail rendering hook
    function loadThumbnails(files) {
        files.forEach((file, index) => {
            // Find the placeholder in the DOM
            const fileItem = fileListContainer.querySelector(`.file-item[data-index="${index}"]`);
            if (!fileItem) return;

            const placeholder = fileItem.querySelector('.file-thumb-placeholder');
            if (!placeholder) return;

            const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic');
            const img = document.createElement('img');
            img.className = 'file-thumb';
            img.alt = file.name;

            if (isHeic) {
                // Fetch dynamic backend preview or use standard HEIC icon
                img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTA5MGI5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01ek0yIDE3bDEwIDUgMTAtNU0yIDEybDEwIDUgMTAtNSIvPjwvc3ZnPg==';
                img.style.opacity = '0.5';

                fetchImagePreview(file)
                    .then(blob => {
                        img.src = URL.createObjectURL(blob);
                        img.style.opacity = '1';
                    })
                    .catch(err => {
                        console.warn('Could not load HEIC preview:', err);
                        img.style.opacity = '1';
                    });
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }

            placeholder.replaceWith(img);
        });
    }

    function setLoading(isLoading) {
        convertBtn.disabled = isLoading;
        if (isLoading) {
            if (progressBar) progressBar.classList.remove('hidden');
            convertBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Converting...';
        } else {
            convertBtn.textContent = 'Convert & Download';
        }
    }

    // Conversion submit
    convertBtn.addEventListener('click', async () => {
        const files = uploader.getFiles();
        if (files.length === 0) return;

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
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 8;
                if (progress > 90) clearInterval(progressInterval);
                if (progressFill) progressFill.style.width = `${progress}%`;
            }, 250);

            const resData = await convertImages(files, options);

            clearInterval(progressInterval);
            if (progressFill) progressFill.style.width = '100%';

            if (resData.success && resData.downloadUrl) {
                triggerDownload(resData.downloadUrl, resData.filename);
                statusMsg.textContent = 'Conversion successful! Your download should start shortly.';
                statusMsg.style.color = 'var(--primary-color)';
                setTimeout(() => resetUI(), 2000);
            } else {
                throw new Error(resData.error || 'Conversion failed');
            }

        } catch (error) {
            console.error('Image Conversion Error:', error);
            statusMsg.textContent = `Error: ${error.message}`;
            statusMsg.style.color = '#ef4444';
        } finally {
            setLoading(false);
        }
    });
}
