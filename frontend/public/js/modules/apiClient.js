/**
 * API CLIENT MODULE (v2)
 * ======================
 * Centralized helper for all backend REST calls.
 *
 * All functions follow the same pattern:
 *   - Build FormData
 *   - Fetch with AbortController timeout (default 120s)
 *   - Parse the standard { success, data, error } JSON schema
 *   - Throw on failure so the caller can catch cleanly
 *
 * WHY AbortController?
 * Without it, fetch will hang indefinitely if the server is slow or crashed.
 * On Render free tier, cold starts can be 20–30s. 120s is generous but capped.
 */

const DEFAULT_TIMEOUT_MS = 120_000; // 2 minutes

/**
 * Wraps fetch with an AbortController timeout.
 * @param {string}  url
 * @param {object}  options    - Standard fetch options (method, body, etc.)
 * @param {number}  timeoutMs  - Abort after this many milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        return res;
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Request timed out. The server took too long to respond.');
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Parse backend response: either return data or throw a meaningful error.
 * Backend always returns: { success: bool, data: {}, error: string, message: string }
 * @param {Response} res
 * @returns {Promise<object>} The data payload
 */
async function parseResponse(res) {
    let body;
    try {
        body = await res.json();
    } catch {
        throw new Error(`Server returned an unreadable response (HTTP ${res.status})`);
    }

    if (!res.ok || body.success === false) {
        // Use backend's error message if available, otherwise fall back to HTTP status
        throw new Error(body.error || body.message || `Server error (HTTP ${res.status})`);
    }

    return body.data || body;
}

// =============================================================================
// IMAGE API
// =============================================================================

export async function convertImages(files, options = {}) {
    const form = new FormData();
    files.forEach(f => form.append('images', f));
    form.append('format',          options.format      || 'png');
    form.append('quality',         options.quality     || '80');
    form.append('maintainAspect',  options.maintainAspect !== false);
    form.append('keepMetadata',    options.keepMetadata === true);
    form.append('useTransparency', options.useTransparency === true);
    form.append('backgroundColor', options.backgroundColor || '#ffffff');
    if (options.width)  form.append('width',  options.width);
    if (options.height) form.append('height', options.height);
    if (options.targetSize) form.append('targetSize', options.targetSize);

    const res = await fetchWithTimeout('/api/image/convert', { method: 'POST', body: form });
    return parseResponse(res);
}

export async function fetchImagePreview(file) {
    const form = new FormData();
    form.append('image', file);
    const res = await fetchWithTimeout('/api/image/preview', { method: 'POST', body: form }, 30_000);
    if (!res.ok) throw new Error('Preview generation failed');
    return res.blob();
}

// =============================================================================
// PDF API
// =============================================================================

/**
 * Merge multiple PDF files into one.
 * @param {File[]} pdfFiles
 */
export async function mergePdfs(pdfFiles) {
    const form = new FormData();
    pdfFiles.forEach(f => form.append('pdfs', f));
    const res = await fetchWithTimeout('/api/pdf/merge', { method: 'POST', body: form });
    return parseResponse(res);
}

/**
 * Split a PDF by page range.
 * @param {File}   pdfFile
 * @param {string} pageRange  - e.g. "1,3,5" or "" for all pages
 */
export async function splitPdf(pdfFile, pageRange = '') {
    const form = new FormData();
    form.append('pdf', pdfFile);
    form.append('pageRange', pageRange);
    const res = await fetchWithTimeout('/api/pdf/split', { method: 'POST', body: form });
    return parseResponse(res);
}

/**
 * Compress a PDF.
 * @param {File}   pdfFile
 * @param {string} mode - 'low' | 'recommended' | 'extreme'
 */
export async function compressPdf(pdfFile, mode = 'recommended') {
    const form = new FormData();
    form.append('pdf', pdfFile);
    form.append('mode', mode);
    const res = await fetchWithTimeout('/api/pdf/compress', { method: 'POST', body: form });
    return parseResponse(res);
}

/**
 * Rotate a PDF.
 * @param {File}   pdfFile
 * @param {number} angle - 90 | 180 | 270
 */
export async function rotatePdf(pdfFile, angle = 90) {
    const form = new FormData();
    form.append('pdf', pdfFile);
    form.append('angle', String(angle));
    const res = await fetchWithTimeout('/api/pdf/rotate', { method: 'POST', body: form });
    return parseResponse(res);
}

/**
 * Add a text watermark to a PDF.
 * @param {File}   pdfFile
 * @param {string} text
 * @param {object} options - { size, color, opacity, rotation }
 */
export async function watermarkPdf(pdfFile, text, options = {}) {
    const form = new FormData();
    form.append('pdf', pdfFile);
    form.append('text',     text);
    form.append('size',     String(options.size     || 50));
    form.append('color',    options.color           || '#cccccc');
    form.append('opacity',  String(options.opacity  || 0.4));
    form.append('rotation', String(options.rotation || -45));
    const res = await fetchWithTimeout('/api/pdf/watermark', { method: 'POST', body: form });
    return parseResponse(res);
}

/**
 * Add page numbers to a PDF.
 * @param {File}   pdfFile
 * @param {object} options - { position, fontSize, format }
 */
export async function addPageNumbers(pdfFile, options = {}) {
    const form = new FormData();
    form.append('pdf',      pdfFile);
    form.append('position', options.position  || 'bottom');
    form.append('fontSize', String(options.fontSize || 10));
    form.append('format',   options.format    || 'Page {num} of {total}');
    const res = await fetchWithTimeout('/api/pdf/page-number', { method: 'POST', body: form });
    return parseResponse(res);
}

/**
 * Convert images to a PDF.
 * @param {File[]} imageFiles - JPG, PNG, WEBP etc.
 */
export async function imagesToPdf(imageFiles) {
    const form = new FormData();
    imageFiles.forEach(f => form.append('images', f));
    const res = await fetchWithTimeout('/api/pdf/images-to-pdf', { method: 'POST', body: form });
    return parseResponse(res);
}

/**
 * Unlock/decrypt a PDF file.
 * @param {File} pdfFile
 * @param {string} password
 */
export async function unlockPdf(pdfFile, password = '') {
    const form = new FormData();
    form.append('pdf', pdfFile);
    form.append('password', password);
    const res = await fetchWithTimeout('/api/pdf/unlock', { method: 'POST', body: form });
    return parseResponse(res);
}

/**
 * Convert Office document (Word, Excel, PPT) to PDF.
 * @param {File} file
 * @param {string} type - 'word' | 'excel' | 'ppt'
 */
export async function convertOfficeToPdf(file, type = 'word') {
    const form = new FormData();
    form.append('file', file);
    const res = await fetchWithTimeout(`/api/pdf/${type}-to-pdf`, { method: 'POST', body: form });
    return parseResponse(res);
}

// =============================================================================
// UTILITIES
// =============================================================================

/** Format byte counts into human-readable strings */
export function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** Programmatically trigger a browser download */
export function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
