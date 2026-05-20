import { mergePdfs, splitPdf, compressPdf, triggerDownload, formatBytes } from './apiClient.js';

export function setupPdfTools() {
    let mergeFiles = [];
    let splitFile = null;
    let compressFile = null;

    // Elements
    const mergeBrowseBtn = document.getElementById('merge-browse-btn');
    const mergeFileInput = document.getElementById('merge-file-input');
    const mergeDropZone = document.getElementById('merge-drop-zone');
    const mergeFileList = document.getElementById('merge-file-list');
    const mergeBtn = document.getElementById('merge-btn');

    const splitBrowseBtn = document.getElementById('split-browse-btn');
    const splitFileInput = document.getElementById('split-file-input');
    const splitDropZone = document.getElementById('split-drop-zone');
    const splitFileItem = document.getElementById('split-file-item');
    const splitOptions = document.getElementById('split-options');
    const pageRangeInput = document.getElementById('page-range');
    const splitBtn = document.getElementById('split-btn');

    const compressBrowseBtn = document.getElementById('compress-browse-btn');
    const compressFileInput = document.getElementById('compress-file-input');
    const compressDropZone = document.getElementById('compress-drop-zone');
    const compressFileItem = document.getElementById('compress-file-item');
    const compressBtn = document.getElementById('compress-btn');

    if (!mergeBrowseBtn && !splitBrowseBtn && !compressBrowseBtn) return; // Prevent run if none are present

    // MERGE PDF Logic
    if (mergeBrowseBtn) {
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

        mergeBtn.addEventListener('click', async () => {
            if (mergeFiles.length < 2) {
                alert('Please select at least 2 PDF files to merge');
                return;
            }

            mergeBtn.disabled = true;
            mergeBtn.textContent = 'Merging...';

            try {
                const resData = await mergePdfs(mergeFiles);
                if (resData.success && resData.downloadUrl) {
                    triggerDownload(resData.downloadUrl, resData.filename);
                }
                mergeFiles = [];
                renderMergeFileList();
            } catch (error) {
                console.error(error);
                alert('Error: ' + error.message);
            } finally {
                mergeBtn.disabled = false;
                mergeBtn.textContent = 'Merge & Download';
            }
        });
    }

    function renderMergeFileList() {
        if (mergeFiles.length === 0) {
            mergeFileList.classList.add('hidden');
            return;
        }
        mergeFileList.classList.remove('hidden');
        mergeFileList.innerHTML = mergeFiles.map((f, i) => `
            <div class="file-item">
                <div class="file-info">
                    <span class="file-name">${f.name}</span>
                    <span class="file-meta">${formatBytes(f.size)}</span>
                </div>
                <button class="remove-btn" type="button" onclick="removeMergeFile(${i})">×</button>
            </div>
        `).join('');
    }

    // Attach globals for inline onclick support
    window.removeMergeFile = (index) => {
        mergeFiles.splice(index, 1);
        renderMergeFileList();
    };

    // SPLIT PDF Logic
    if (splitBrowseBtn) {
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

        splitBtn.addEventListener('click', async () => {
            if (!splitFile) {
                alert('Please select a PDF file to split');
                return;
            }

            splitBtn.disabled = true;
            splitBtn.textContent = 'Splitting...';

            try {
                const resData = await splitPdf(splitFile, pageRangeInput.value);
                if (resData.success && resData.downloadUrl) {
                    triggerDownload(resData.downloadUrl, resData.filename);
                }
                splitFile = null;
                renderSplitFileItem();
            } catch (error) {
                console.error(error);
                alert('Error: ' + error.message);
            } finally {
                splitBtn.disabled = false;
                splitBtn.textContent = 'Split & Download';
            }
        });
    }

    function renderSplitFileItem() {
        if (!splitFile) {
            splitFileItem.classList.add('hidden');
            splitOptions.classList.add('hidden');
            return;
        }
        splitFileItem.classList.remove('hidden');
        splitOptions.classList.remove('hidden');
        splitFileItem.innerHTML = `
            <div class="file-item">
                <div class="file-info">
                    <span class="file-name">${splitFile.name}</span>
                    <span class="file-meta">${formatBytes(splitFile.size)}</span>
                </div>
                <button class="remove-btn" type="button" onclick="removeSplitFile()">×</button>
            </div>
        `;
    }

    window.removeSplitFile = () => {
        splitFile = null;
        renderSplitFileItem();
    };

    // COMPRESS PDF Logic
    if (compressBrowseBtn) {
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

        compressBtn.addEventListener('click', async () => {
            if (!compressFile) {
                alert('Please select a PDF file to compress');
                return;
            }

            compressBtn.disabled = true;
            compressBtn.textContent = 'Compressing...';

            try {
                const resData = await compressPdf(compressFile);
                if (resData.success && resData.downloadUrl) {
                    triggerDownload(resData.downloadUrl, resData.filename);
                }
                compressFile = null;
                renderCompressFileItem();
            } catch (error) {
                console.error(error);
                alert('Error: ' + error.message);
            } finally {
                compressBtn.disabled = false;
                compressBtn.textContent = 'Compress & Download';
            }
        });
    }

    function renderCompressFileItem() {
        if (!compressFile) {
            compressFileItem.classList.add('hidden');
            return;
        }
        compressFileItem.classList.remove('hidden');
        compressFileItem.innerHTML = `
            <div class="file-item">
                <div class="file-info">
                    <span class="file-name">${compressFile.name}</span>
                    <span class="file-meta">${formatBytes(compressFile.size)}</span>
                </div>
                <button class="remove-btn" type="button" onclick="removeCompressFile()">×</button>
            </div>
        `;
    }

    window.removeCompressFile = () => {
        compressFile = null;
        renderCompressFileItem();
    };
}
