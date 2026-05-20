/**
 * PlusConversion - API Client Module
 * Provides structured helpers for all backend REST operations.
 */

export async function fetchImagePreview(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/image/preview', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Preview generation failed');
    }

    return await response.blob();
}

export async function convertImages(files, options = {}) {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('images', file);
    });

    formData.append('format', options.format || 'png');
    formData.append('quality', options.quality || '80');
    
    if (options.width) formData.append('width', options.width);
    if (options.height) formData.append('height', options.height);
    formData.append('maintainAspect', options.maintainAspect !== false);

    if (options.targetSize) {
        formData.append('targetSize', options.targetSize);
    }

    formData.append('keepMetadata', options.keepMetadata === true);
    formData.append('useTransparency', options.useTransparency === true);
    formData.append('backgroundColor', options.backgroundColor || '#ffffff');

    const response = await fetch('/api/image/convert', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Image conversion failed');
    }

    return await response.json();
}

export async function mergePdfs(pdfFiles) {
    const formData = new FormData();
    pdfFiles.forEach(file => {
        formData.append('pdfs', file);
    });

    const response = await fetch('/api/pdf/merge', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF Merge failed');
    }

    return await response.json();
}

export async function splitPdf(pdfFile, pageRange = '') {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('pageRange', pageRange);

    const response = await fetch('/api/pdf/split', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF Split failed');
    }

    return await response.json();
}

export async function compressPdf(pdfFile) {
    const formData = new FormData();
    formData.append('pdf', pdfFile);

    const response = await fetch('/api/pdf/compress', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF Compression failed');
    }

    return await response.json();
}

export function triggerDownload(downloadUrl, filename) {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
