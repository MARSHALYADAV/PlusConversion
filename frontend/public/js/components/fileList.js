/**
 * FILE LIST HELPER
 * ================
 * Renders and manages the list of selected files shown above the action button.
 * Shared by all tool pages to avoid duplication.
 *
 * Usage:
 *   import FileList from '../components/fileList.js';
 *
 *   const fl = new FileList({
 *       containerEl: document.getElementById('file-list'),
 *       onUpdate: (files) => { submitBtn.disabled = files.length === 0; }
 *   });
 *
 *   fl.add([file1, file2]);
 *   fl.getFiles()  // → File[]
 *   fl.clear()
 */

import { formatBytes } from '../modules/apiClient.js';

// Inline SVG path data for file type icons
const SVG_S = `xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;
const FILE_ICONS = {
    pdf:  `<svg ${SVG_S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    img:  `<svg ${SVG_S}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"/></svg>`,
    file: `<svg ${SVG_S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
};
const CHEVRON_UP   = `<svg ${SVG_S}><polyline points="18 15 12 9 6 15"/></svg>`;
const CHEVRON_DOWN = `<svg ${SVG_S}><polyline points="6 9 12 15 18 9"/></svg>`;
const X_SVG        = `<svg ${SVG_S}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

function fileIcon(name) {
    const ext = (name || '').split('.').pop().toLowerCase();
    return ICON_MAP[ext] || 'file';
}

export default class FileList {
    /**
     * @param {object}   opts
     * @param {HTMLElement} opts.containerEl  - The .file-list element
     * @param {Function} [opts.onUpdate]     - Called with File[] whenever the list changes
     * @param {boolean}  [opts.allowReorder] - If true, adds up/down reorder buttons (for merge)
     */
    constructor({ containerEl, onUpdate, allowReorder = false }) {
        this.containerEl = containerEl;
        this.onUpdate = onUpdate;
        this.allowReorder = allowReorder;
        this._files = [];
    }

    /** Add files to the list (deduplicates by name+size) */
    add(newFiles) {
        for (const f of newFiles) {
            const isDupe = this._files.some(existing =>
                existing.name === f.name && existing.size === f.size
            );
            if (!isDupe) this._files.push(f);
        }
        this._render();
        if (this.onUpdate) this.onUpdate([...this._files]);
    }

    /** Replace all files */
    set(files) {
        this._files = [...files];
        this._render();
        if (this.onUpdate) this.onUpdate([...this._files]);
    }

    /** Get a copy of the current file array */
    getFiles() { return [...this._files]; }

    /** Remove all files */
    clear() {
        this._files = [];
        this._render();
        if (this.onUpdate) this.onUpdate([]);
    }

    /** Re-render the list container */
    _render() {
        const c = this.containerEl;
        if (!c) return;

        if (this._files.length === 0) {
            c.classList.add('hidden');
            c.innerHTML = '';
            return;
        }

        c.classList.remove('hidden');
        c.innerHTML = this._files.map((f, i) => {
            const ext = f.name.split('.').pop().toLowerCase();
            const fileIconSvg = ['pdf'].includes(ext)
                ? FILE_ICONS.pdf
                : ['jpg','jpeg','png','webp','gif','heic','avif'].includes(ext)
                    ? FILE_ICONS.img
                    : FILE_ICONS.file;
            return `
            <div class="file-item" data-index="${i}">
                <div class="file-item-icon">
                    ${fileIconSvg}
                </div>
                <div class="file-item-info">
                    <div class="file-item-name" title="${f.name}">${f.name}</div>
                    <div class="file-item-meta">${formatBytes(f.size)}</div>
                </div>
                ${this.allowReorder ? `
                    <button class="btn btn-ghost btn-sm reorder-up" data-index="${i}" title="Move up" aria-label="Move ${f.name} up" ${i === 0 ? 'disabled' : ''}>
                        ${CHEVRON_UP}
                    </button>
                    <button class="btn btn-ghost btn-sm reorder-down" data-index="${i}" title="Move down" aria-label="Move ${f.name} down" ${i === this._files.length - 1 ? 'disabled' : ''}>
                        ${CHEVRON_DOWN}
                    </button>
                ` : ''}
                <button class="file-item-remove" data-index="${i}" aria-label="Remove ${f.name}">
                    ${X_SVG}
                </button>
            </div>
        `;}).join('');

        // Bind remove buttons
        c.querySelectorAll('.file-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                this._files.splice(parseInt(btn.dataset.index), 1);
                this._render();
                if (this.onUpdate) this.onUpdate([...this._files]);
            });
        });

        // Bind reorder buttons
        if (this.allowReorder) {
            c.querySelectorAll('.reorder-up').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.index);
                    if (idx > 0) {
                        [this._files[idx - 1], this._files[idx]] = [this._files[idx], this._files[idx - 1]];
                        this._render();
                        if (this.onUpdate) this.onUpdate([...this._files]);
                    }
                });
            });
            c.querySelectorAll('.reorder-down').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.index);
                    if (idx < this._files.length - 1) {
                        [this._files[idx], this._files[idx + 1]] = [this._files[idx + 1], this._files[idx]];
                        this._render();
                        if (this.onUpdate) this.onUpdate([...this._files]);
                    }
                });
            });
        }
    }
}
