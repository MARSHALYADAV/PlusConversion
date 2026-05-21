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
     * @param {object|string} optsOrId - Options object (modern) or string ID of container (legacy)
     * @param {HTMLElement} [optsOrId.containerEl]  - The .result-card element
     * @param {Function}  [optsOrId.onReset]      - Called when "Convert Another" is clicked
     */
    constructor(optsOrId) {
        if (typeof optsOrId === 'string') {
            this.containerEl = document.getElementById(optsOrId);
            this.isLegacy = true;
            this._restartCallbacks = [];
            this.onReset = () => {
                this._restartCallbacks.forEach(cb => cb());
            };
        } else {
            const { containerEl, onReset } = optsOrId || {};
            this.containerEl = containerEl;
            this.onReset = onReset;
            this.isLegacy = false;
        }
    }

    /**
     * Legacy handler to register "Convert Another" click callback.
     * @param {Function} callback
     */
    onRestart(callback) {
        if (this.isLegacy) {
            this._restartCallbacks.push(callback);
        } else {
            this.onReset = callback;
        }
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

        // Inline SVG helpers
        const FILE_SVG      = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
        const DB_SVG        = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`;
        const DOWN_SVG      = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`;
        const SLIDERS_SVG   = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`;
        const CHECK_SVG     = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        const DOWNLOAD_SVG  = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
        const RESET_SVG     = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v6h6"/><path d="M21 12a9 9 0 0 0-15-6.7L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>`;

        // Build meta items
        const metaItems = [];
        if (filename) {
            metaItems.push(`<span class="result-meta-item">${FILE_SVG} ${filename}</span>`);
        }
        if (size) {
            metaItems.push(`<span class="result-meta-item">${DB_SVG} ${formatBytes(size)}</span>`);
        }
        if (originalSize && size && originalSize > size) {
            const saved = Math.round((1 - size / originalSize) * 100);
            metaItems.push(`<span class="result-meta-item" style="color:var(--success)">${DOWN_SVG} ${saved}% smaller</span>`);
        }
        if (compressionMode) {
            const modeLabel = { low: 'Light', recommended: 'Recommended', extreme: 'Extreme' }[compressionMode] || compressionMode;
            metaItems.push(`<span class="result-meta-item">${SLIDERS_SVG} ${modeLabel}</span>`);
        }

        c.innerHTML = `
            <div class="result-icon">${CHECK_SVG}</div>
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
                    ${DOWNLOAD_SVG} Download
                </a>
                <button class="btn btn-secondary" id="result-reset-btn">
                    ${RESET_SVG} Convert Another
                </button>
            </div>
        `;

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
