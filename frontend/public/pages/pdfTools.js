/**
 * PlusConversion - PDF Tools Page Module
 * Handles PDF Merge, Split, and Compress operations using encapsulated upload components.
 */

import { initUploadZone } from '../components/uploadZone.js';
import { mergePdfs, splitPdf, compressPdf, triggerDownload, formatBytes } from '../utils/apiClient.js';

export function setupPdfTools() {
    // 1. MERGE PDF Elements & Setup
    const mergeBrowseBtn = document.getElementById('merge-browse-btn');
    const mergeFileInput = document.getElementById('merge-file-input');
    const mergeDropZone = document.getElementById('merge-drop-zone');
    const mergeFileList = document.getElementById('merge-file-list');
    const mergeBtn = document.getElementById('merge-btn');

    let mergeUploader = null;
    if (mergeDropZone) {
        mergeUploader = initUploadZone({
            dropZoneEl: mergeDropZone,
            fileInputEl: mergeFileInput,
            browseBtnEl: mergeBrowseBtn,
            fileListEl: mergeFileList,
            multiple: true,
            maxSizeMB: 50
        });

        mergeBtn.addEventListener('click', async () => {
            const files = mergeUploader.getFiles();
            if (files.length < 2) {
                alert('Please select at least 2 PDF files to merge');
                return;
            }

            mergeBtn.disabled = true;
            mergeBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Merging...';
            if (typeof lucide !== 'undefined') { lucide.createIcons(); }

            try {
                const resData = await mergePdfs(files);
                if (resData.success && resData.downloadUrl) {
                    triggerDownload(resData.downloadUrl, resData.filename);
                }
                mergeUploader.clear();
            } catch (error) {
                console.error(error);
                alert('Error merging PDFs: ' + error.message);
            } finally {
                mergeBtn.disabled = false;
                mergeBtn.textContent = 'Merge & Download';
            }
        });
    }

    // 2. SPLIT PDF Elements & Setup
    const splitBrowseBtn = document.getElementById('split-browse-btn');
    const splitFileInput = document.getElementById('split-file-input');
    const splitDropZone = document.getElementById('split-drop-zone');
    const splitFileItem = document.getElementById('split-file-item');
    const splitOptions = document.getElementById('split-options');
    const pageRangeInput = document.getElementById('page-range');
    const splitBtn = document.getElementById('split-btn');

    let splitUploader = null;
    if (splitDropZone) {
        splitUploader = initUploadZone({
            dropZoneEl: splitDropZone,
            fileInputEl: splitFileInput,
            browseBtnEl: splitBrowseBtn,
            fileListEl: splitFileItem,
            multiple: false,
            maxSizeMB: 50,
            onFilesAdded: () => {
                if (splitOptions) splitOptions.classList.remove('hidden');
            },
            onFileRemoved: () => {
                if (splitOptions) splitOptions.classList.add('hidden');
            }
        });

        splitBtn.addEventListener('click', async () => {
            const files = splitUploader.getFiles();
            if (files.length === 0) {
                alert('Please select a PDF file to split');
                return;
            }

            splitBtn.disabled = true;
            splitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Splitting...';
            if (typeof lucide !== 'undefined') { lucide.createIcons(); }

            try {
                const resData = await splitPdf(files[0], pageRangeInput.value);
                if (resData.success && resData.downloadUrl) {
                    triggerDownload(resData.downloadUrl, resData.filename);
                }
                splitUploader.clear();
                if (splitOptions) splitOptions.classList.add('hidden');
                if (pageRangeInput) pageRangeInput.value = '';
            } catch (error) {
                console.error(error);
                alert('Error splitting PDF: ' + error.message);
            } finally {
                splitBtn.disabled = false;
                splitBtn.textContent = 'Split & Download';
            }
        });
    }

    // 3. COMPRESS PDF Elements & Setup
    const compressBrowseBtn = document.getElementById('compress-browse-btn');
    const compressFileInput = document.getElementById('compress-file-input');
    const compressDropZone = document.getElementById('compress-drop-zone');
    const compressFileItem = document.getElementById('compress-file-item');
    const compressBtn = document.getElementById('compress-btn');

    let compressUploader = null;
    if (compressDropZone) {
        compressUploader = initUploadZone({
            dropZoneEl: compressDropZone,
            fileInputEl: compressFileInput,
            browseBtnEl: compressBrowseBtn,
            fileListEl: compressFileItem,
            multiple: false,
            maxSizeMB: 50
        });

        compressBtn.addEventListener('click', async () => {
            const files = compressUploader.getFiles();
            if (files.length === 0) {
                alert('Please select a PDF file to compress');
                return;
            }

            compressBtn.disabled = true;
            compressBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Compressing...';
            if (typeof lucide !== 'undefined') { lucide.createIcons(); }

            try {
                const resData = await compressPdf(files[0]);
                if (resData.success && resData.downloadUrl) {
                    triggerDownload(resData.downloadUrl, resData.filename);
                }
                compressUploader.clear();
            } catch (error) {
                console.error(error);
                alert('Error compressing PDF: ' + error.message);
            } finally {
                compressBtn.disabled = false;
                compressBtn.textContent = 'Compress & Download';
            }
        });
    }
}
