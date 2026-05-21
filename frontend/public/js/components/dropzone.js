/**
 * DROPZONE COMPONENT
 * ==================
 * Reusable drag-and-drop file upload zone.
 *
 * Usage:
 *   import DropZone from '../components/dropzone.js';
 *
 *   const dz = new DropZone({
 *       containerEl: document.getElementById('my-drop-zone'),
 *       inputEl:     document.getElementById('my-file-input'),
 *       browseBtn:   document.getElementById('my-browse-btn'),
 *       accept:      ['.pdf'],          // file extensions to accept
 *       multiple:    true,              // allow multiple files
 *       maxSizeMb:   100,              // per-file max in MB
 *       onFiles:     (files) => { ... }// called with File[] on valid selection
 *   });
 *
 * WHY A CLASS?
 * Multiple tool pages use dropzones. A class avoids duplicating the 30+ lines
 * of drag/drop wiring on every page.
 */

import Toast from './toast.js';

export default class DropZone {
    /**
     * @param {object} opts
     * @param {HTMLElement} opts.containerEl  - The .drop-zone div
     * @param {HTMLInputElement} opts.inputEl - Hidden <input type="file">
     * @param {HTMLElement} [opts.browseBtn]  - "Browse Files" button (optional)
     * @param {string[]}   [opts.accept]      - Allowed extensions e.g. ['.pdf']
     * @param {boolean}    [opts.multiple]    - Allow multiple files (default false)
     * @param {number}     [opts.maxSizeMb]   - Max file size in MB (default 100)
     * @param {Function}   opts.onFiles       - Callback(File[]) on valid drop/select
     */
    constructor({ containerEl, inputEl, browseBtn, accept = [], multiple = false, maxSizeMb = 100, onFiles }) {
        this.containerEl = containerEl;
        this.inputEl = inputEl;
        this.accept = accept.map(a => a.toLowerCase());
        this.multiple = multiple;
        this.maxSizeBytes = maxSizeMb * 1024 * 1024;
        this.onFiles = onFiles;

        if (!containerEl || !inputEl || !onFiles) {
            console.error('DropZone: containerEl, inputEl, and onFiles are required');
            return;
        }

        this._bind(browseBtn);
    }

    _bind(browseBtn) {
        const { containerEl, inputEl } = this;

        // Click on container → open file picker
        containerEl.addEventListener('click', (e) => {
            // Don't trigger if user clicked the browse button itself (it handles its own click)
            if (browseBtn && e.target.closest('button') === browseBtn) return;
            inputEl.click();
        });

        // Browse button → open file picker
        if (browseBtn) {
            browseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                inputEl.click();
            });
        }

        // File input change (browse selected)
        inputEl.addEventListener('change', () => {
            this._handleFiles(Array.from(inputEl.files || []));
            // Reset so same file can be re-selected
            inputEl.value = '';
        });

        // Drag and drop events
        containerEl.addEventListener('dragenter', this._onDragEnter.bind(this));
        containerEl.addEventListener('dragover',  this._onDragOver.bind(this));
        containerEl.addEventListener('dragleave', this._onDragLeave.bind(this));
        containerEl.addEventListener('drop',      this._onDrop.bind(this));

        // Also allow drop anywhere on the page for better UX
        document.addEventListener('dragover', e => e.preventDefault());
        document.addEventListener('drop', e => {
            // Only if the drop target is NOT our zone (avoid double-triggering)
            if (!containerEl.contains(e.target)) e.preventDefault();
        });
    }

    _onDragEnter(e) {
        e.preventDefault();
        this.containerEl.classList.add('drag-over');
    }

    _onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        this.containerEl.classList.add('drag-over');
    }

    _onDragLeave(e) {
        // Only remove if leaving the container entirely (not a child element)
        if (!this.containerEl.contains(e.relatedTarget)) {
            this.containerEl.classList.remove('drag-over');
        }
    }

    _onDrop(e) {
        e.preventDefault();
        this.containerEl.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files || []);
        this._handleFiles(files);
    }

    /**
     * Validate and dispatch files to the onFiles callback.
     * @param {File[]} files
     */
    _handleFiles(files) {
        if (!files.length) return;

        // If single mode, only keep the first file
        const candidates = this.multiple ? files : [files[0]];

        const valid = [];
        for (const file of candidates) {
            // Extension check
            if (this.accept.length > 0) {
                const ext = '.' + file.name.split('.').pop().toLowerCase();
                if (!this.accept.includes(ext)) {
                    Toast.show(`"${file.name}" is not a supported file type.`, 'error');
                    continue;
                }
            }
            // Size check
            if (file.size > this.maxSizeBytes) {
                const mb = (this.maxSizeBytes / 1024 / 1024).toFixed(0);
                Toast.show(`"${file.name}" exceeds the ${mb}MB limit.`, 'error');
                continue;
            }
            valid.push(file);
        }

        if (valid.length > 0) {
            this.onFiles(valid);
        }
    }

    /** Programmatically clear drag-over state */
    reset() {
        this.containerEl.classList.remove('drag-over');
    }
}
