// PDF Tools Data
const pdfTools = [
  {
    id: 'merge',
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into one document.',
    icon: 'fa-solid fa-file-arrow-down',
    route: 'merge'
  },
  {
    id: 'split',
    title: 'Split PDF',
    description: 'Split a PDF into individual pages or sections.',
    icon: 'fa-solid fa-file-lines',
    route: 'split'
  },
  {
    id: 'compress',
    title: 'Compress PDF',
    description: 'Reduce PDF file size while keeping readability.',
    icon: 'fa-solid fa-compress',
    route: 'compress'
  },
  {
    id: 'convert-to-pdf',
    title: 'Convert to PDF',
    description: 'Turn images or documents into PDF format.',
    icon: 'fa-solid fa-file-export',
    route: '#'
  },
  {
    id: 'unlock',
    title: 'Unlock PDF',
    description: 'Remove password protection from PDFs securely.',
    icon: 'fa-solid fa-lock-open',
    route: '#'
  },
  {
    id: 'protect',
    title: 'Protect PDF',
    description: 'Add a password to keep your PDF files safe.',
    icon: 'fa-solid fa-lock',
    route: '#'
  }
];

// Render Tool Grid
function renderToolGrid() {
  const grid = document.getElementById('tool-grid');
  grid.innerHTML = pdfTools.map(tool => `
    <article class="tool-card" ${tool.route !== '#' ? `data-tool="${tool.route}"` : ''}>
      ${tool.route === '#' ? '<div class="badge-coming-soon">Coming Soon</div>' : ''}
      <div class="tool-card-icon">
        <i class="${tool.icon}"></i>
      </div>
      <div class="tool-card-body">
        <h4>${tool.title}</h4>
        <p>${tool.description}</p>
      </div>
      <div class="tool-card-action">
        <a href="${tool.route === '#' ? '#' : 'javascript:void(0)'}" class="btn btn-secondary btn-sm" ${tool.route !== '#' ? `onclick="showTool('${tool.route}')"` : 'onclick="alert(\'Coming soon!\')"'}>Open</a>
      </div>
    </article>
  `).join('');
}

// Navigation Functions
function showTool(toolName) {
  document.getElementById('tools-grid-section').classList.add('hidden');
  document.getElementById('converter-section').classList.add('hidden');
  document.getElementById(`${toolName}-pdf-section`).classList.remove('hidden');
}

function backToGrid() {
  document.querySelectorAll('.pdf-tool-section').forEach(el => el.classList.add('hidden'));
  document.getElementById('tools-grid-section').classList.remove('hidden');
  document.getElementById('converter-section').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    renderToolGrid();
    setupPdfToolHandlers();
    
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
                        // Visual error feedback
                        img.style.opacity = '1';
                        img.style.border = '2px solid #ef4444';
                        img.title = 'Preview failed. File might be corrupted or unsupported.';
                        // Optional: Replace src with an error icon
                        // img.src = 'path/to/error-icon.svg'; 
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

    // PDF Tool Handlers
    let mergeFiles = [];
    let splitFile = null;
    let compressFile = null;

    function setupPdfToolHandlers() {
        // Back buttons
        ['merge', 'split', 'compress'].forEach(tool => {
            const backBtn = document.getElementById(`back-${tool}`);
            if (backBtn) backBtn.addEventListener('click', backToGrid);
        });

        // MERGE PDF
        const mergeBrowseBtn = document.getElementById('merge-browse-btn');
        const mergeFileInput = document.getElementById('merge-file-input');
        const mergeDropZone = document.getElementById('merge-drop-zone');
        const mergeFileList = document.getElementById('merge-file-list');
        const mergeBtn = document.getElementById('merge-btn');

        mergeBrowseBtn.addEventListener('click', () => mergeFileInput.click());
        mergeFileInput.addEventListener('change', (e) => {
            mergeFiles = [...mergeFiles, ...Array.from(e.target.files)];
            renderMergeFileList();
        });
        mergeDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            mergeDropZone.classList.add('dragover');
        });
        mergeDropZone.addEventListener('dragleave', () => mergeDropZone.classList.remove('dragover'));
        mergeDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            mergeDropZone.classList.remove('dragover');
            mergeFiles = [...mergeFiles, ...Array.from(e.dataTransfer.files)];
            renderMergeFileList();
        });

        function renderMergeFileList() {
            if (mergeFiles.length === 0) return;
            mergeFileList.classList.remove('hidden');
            mergeFileList.innerHTML = mergeFiles.map((f, i) => `
                <div class="file-item">
                    <div class="file-info">
                        <span class="file-name">${f.name}</span>
                        <span class="file-meta">${formatFileSize(f.size)}</span>
                    </div>
                    <button class="remove-btn" type="button" onclick="removeMergeFile(${i})">×</button>
                </div>
            `).join('');
        }

        mergeBtn.addEventListener('click', async () => {
            if (mergeFiles.length < 2) {
                alert('Please select at least 2 PDF files to merge');
                return;
            }
            const formData = new FormData();
            mergeFiles.forEach(f => formData.append('pdfs', f));
            try {
                const response = await fetch('/api/pdf/merge', { method: 'POST', body: formData });
                if (!response.ok) throw new Error('Merge failed');
                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'merged.pdf';
                document.body.appendChild(link);
                link.click();
                link.remove();
                mergeFiles = [];
                renderMergeFileList();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        // SPLIT PDF
        const splitBrowseBtn = document.getElementById('split-browse-btn');
        const splitFileInput = document.getElementById('split-file-input');
        const splitDropZone = document.getElementById('split-drop-zone');
        const splitFileItem = document.getElementById('split-file-item');
        const splitOptions = document.getElementById('split-options');
        const pageRangeInput = document.getElementById('page-range');
        const splitBtn = document.getElementById('split-btn');

        splitBrowseBtn.addEventListener('click', () => splitFileInput.click());
        splitFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                splitFile = e.target.files[0];
                renderSplitFileItem();
            }
        });
        splitDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            splitDropZone.classList.add('dragover');
        });
        splitDropZone.addEventListener('dragleave', () => splitDropZone.classList.remove('dragover'));
        splitDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            splitDropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                splitFile = e.dataTransfer.files[0];
                renderSplitFileItem();
            }
        });

        function renderSplitFileItem() {
            if (!splitFile) return;
            splitFileItem.classList.remove('hidden');
            splitOptions.classList.remove('hidden');
            splitFileItem.innerHTML = `
                <div class="file-item">
                    <div class="file-info">
                        <span class="file-name">${splitFile.name}</span>
                        <span class="file-meta">${formatFileSize(splitFile.size)}</span>
                    </div>
                    <button class="remove-btn" type="button" onclick="removeSplitFile()">×</button>
                </div>
            `;
        }

        splitBtn.addEventListener('click', async () => {
            if (!splitFile) {
                alert('Please select a PDF file to split');
                return;
            }
            const formData = new FormData();
            formData.append('pdf', splitFile);
            formData.append('pageRange', pageRangeInput.value);
            try {
                const response = await fetch('/api/pdf/split', { method: 'POST', body: formData });
                if (!response.ok) throw new Error('Split failed');
                const blob = await response.blob();
                const disposition = response.headers.get('content-disposition');
                const filename = disposition?.match(/filename="(.+)"/)?.[1] || 'split.pdf';
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                link.remove();
                splitFile = null;
                renderSplitFileItem();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        // COMPRESS PDF
        const compressBrowseBtn = document.getElementById('compress-browse-btn');
        const compressFileInput = document.getElementById('compress-file-input');
        const compressDropZone = document.getElementById('compress-drop-zone');
        const compressFileItem = document.getElementById('compress-file-item');
        const compressBtn = document.getElementById('compress-btn');

        compressBrowseBtn.addEventListener('click', () => compressFileInput.click());
        compressFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                compressFile = e.target.files[0];
                renderCompressFileItem();
            }
        });
        compressDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            compressDropZone.classList.add('dragover');
        });
        compressDropZone.addEventListener('dragleave', () => compressDropZone.classList.remove('dragover'));
        compressDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            compressDropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                compressFile = e.dataTransfer.files[0];
                renderCompressFileItem();
            }
        });

        function renderCompressFileItem() {
            if (!compressFile) return;
            compressFileItem.classList.remove('hidden');
            compressFileItem.innerHTML = `
                <div class="file-item">
                    <div class="file-info">
                        <span class="file-name">${compressFile.name}</span>
                        <span class="file-meta">${formatFileSize(compressFile.size)}</span>
                    </div>
                    <button class="remove-btn" type="button" onclick="removeCompressFile()">×</button>
                </div>
            `;
        }

        compressBtn.addEventListener('click', async () => {
            if (!compressFile) {
                alert('Please select a PDF file to compress');
                return;
            }
            const formData = new FormData();
            formData.append('pdf', compressFile);
            try {
                const response = await fetch('/api/pdf/compress', { method: 'POST', body: formData });
                if (!response.ok) throw new Error('Compress failed');
                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'compressed.pdf';
                document.body.appendChild(link);
                link.click();
                link.remove();
                compressFile = null;
                renderCompressFileItem();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    window.removeMergeFile = (index) => {
        mergeFiles.splice(index, 1);
        const mergeFileList = document.getElementById('merge-file-list');
        if (mergeFiles.length === 0) {
            mergeFileList.classList.add('hidden');
        } else {
            const mergeDropZone = document.getElementById('merge-drop-zone');
            mergeFileList.innerHTML = mergeFiles.map((f, i) => `
                <div class="file-item">
                    <div class="file-info">
                        <span class="file-name">${f.name}</span>
                        <span class="file-meta">${formatFileSize(f.size)}</span>
                    </div>
                    <button class="remove-btn" type="button" onclick="removeMergeFile(${i})">×</button>
                </div>
            `).join('');
        }
    };

    window.removeSplitFile = () => {
        splitFile = null;
        const splitFileItem = document.getElementById('split-file-item');
        const splitOptions = document.getElementById('split-options');
        splitFileItem.classList.add('hidden');
        splitOptions.classList.add('hidden');
    };

    window.removeCompressFile = () => {
        compressFile = null;
        const compressFileItem = document.getElementById('compress-file-item');
        compressFileItem.classList.add('hidden');
    };

    function formatFileSize(bytes) {
        const k = 1024;
        const decimals = 2;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    window.formatFileSize = formatFileSize;
});
