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

const ICON_MAP = {
    pdf:  'file-text',
    jpg:  'file-image',
    jpeg: 'file-image',
    png:  'file-image',
    webp: 'file-image',
    gif:  'file-image',
};

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
        c.innerHTML = this._files.map((f, i) => `
            <div class="file-item" data-index="${i}">
                <div class="file-item-icon">
                    <i data-lucide="${fileIcon(f.name)}"></i>
                </div>
                <div class="file-item-info">
                    <div class="file-item-name" title="${f.name}">${f.name}</div>
                    <div class="file-item-meta">${formatBytes(f.size)}</div>
                </div>
                ${this.allowReorder ? `
                    <button class="btn btn-ghost btn-sm reorder-up" data-index="${i}" title="Move up" aria-label="Move ${f.name} up" ${i === 0 ? 'disabled' : ''}>
                        <i data-lucide="chevron-up"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm reorder-down" data-index="${i}" title="Move down" aria-label="Move ${f.name} down" ${i === this._files.length - 1 ? 'disabled' : ''}>
                        <i data-lucide="chevron-down"></i>
                    </button>
                ` : ''}
                <button class="file-item-remove" data-index="${i}" aria-label="Remove ${f.name}">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

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
