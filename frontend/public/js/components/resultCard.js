/**
 * RESULT CARD COMPONENT
 * =====================
 * Renders the post-processing download card with filename, size,
 * download button, and a "Convert Another" reset button.
 *
 * Usage:
 *   import ResultCard from '../components/resultCard.js';
 *
 *   const rc = new ResultCard({
 *       containerEl: document.getElementById('result-section'),
 *       onReset: () => ui.reset()
 *   });
 *
 *   rc.show({
 *       downloadUrl: 'https://...',
 *       filename:    'merged.pdf',
 *       size:        204800,         // bytes
 *       originalSize: 512000,        // optional — shows compression ratio
 *       compressionMode: 'recommended' // optional
 *   });
 */

export function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export default class ResultCard {
    /**
     * @param {object} opts
     * @param {HTMLElement} opts.containerEl  - The .result-card element
     * @param {Function}  [opts.onReset]      - Called when "Convert Another" is clicked
     */
    constructor({ containerEl, onReset }) {
        this.containerEl = containerEl;
        this.onReset = onReset;
    }

    /**
     * Populate and show the result card.
     * @param {object} data
     * @param {string} data.downloadUrl      - URL to the processed file
     * @param {string} data.filename         - Suggested download filename
     * @param {number} [data.size]           - Output size in bytes
     * @param {number} [data.originalSize]   - Input size in bytes (for compression ratio)
     * @param {string} [data.compressionMode]- 'low'|'recommended'|'extreme'
     */
    show({ downloadUrl, filename, size, originalSize, compressionMode }) {
        const c = this.containerEl;

        // Build meta items
        const metaItems = [];
        if (filename) {
            metaItems.push(`<span class="result-meta-item"><i data-lucide="file"></i> ${filename}</span>`);
        }
        if (size) {
            metaItems.push(`<span class="result-meta-item"><i data-lucide="database"></i> ${formatBytes(size)}</span>`);
        }
        if (originalSize && size && originalSize > size) {
            const saved = Math.round((1 - size / originalSize) * 100);
            metaItems.push(`<span class="result-meta-item" style="color:var(--success)"><i data-lucide="arrow-down"></i> ${saved}% smaller</span>`);
        }
        if (compressionMode) {
            const modeLabel = { low: 'Light', recommended: 'Recommended', extreme: 'Extreme' }[compressionMode] || compressionMode;
            metaItems.push(`<span class="result-meta-item"><i data-lucide="sliders"></i> ${modeLabel}</span>`);
        }

        c.innerHTML = `
            <div class="result-icon"><i data-lucide="check-circle-2"></i></div>
            <div class="result-title">Ready to Download!</div>
            <div class="result-meta">${metaItems.join('')}</div>
            <div class="result-actions">
                <a
                    href="${downloadUrl}"
                    download="${filename || 'download'}"
                    class="btn btn-primary"
                    id="result-download-btn"
                    aria-label="Download ${filename || 'file'}"
                >
                    <i data-lucide="download"></i> Download
                </a>
                <button class="btn btn-secondary" id="result-reset-btn">
                    <i data-lucide="rotate-ccw"></i> Convert Another
                </button>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Wire reset button
        const resetBtn = c.querySelector('#result-reset-btn');
        if (resetBtn && this.onReset) {
            resetBtn.addEventListener('click', () => this.onReset());
        }

        // Make visible
        c.classList.remove('hidden');
        c.classList.add('visible');

        // Auto-trigger download after short delay (better UX than making user click)
        setTimeout(() => triggerDownload(downloadUrl, filename), 600);
    }

    /** Hide the result card */
    hide() {
        this.containerEl.classList.add('hidden');
        this.containerEl.classList.remove('visible');
        this.containerEl.innerHTML = '';
    }
}
