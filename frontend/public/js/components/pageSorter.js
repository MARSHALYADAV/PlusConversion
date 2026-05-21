import Toast from './toast.js';

/**
 * PageSorter
 * Renders PDF pages as thumbnails and allows extracting, removing, or rearranging them.
 */
class PageSorter {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`Container ${containerId} not found`);

        // 'rearrange', 'remove', 'extract', 'organize'
        this.mode = options.mode || 'rearrange';
        this.onProcess = options.onProcess || (() => {});
        
        this.pdfDocument = null;
        this.pages = []; // Array of objects: { originalIndex: 1, deleted: false, selected: false, rotation: 0 }
        
        this.renderLayout();
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="page-sorter-header">
                <h3 id="ps-title">Loading pages...</h3>
                <div style="display:flex; gap:0.5rem;">
                    ${this.mode === 'extract' ? `<button class="btn btn-secondary btn-sm" id="ps-select-all">Select All</button>` : ''}
                    <button class="btn btn-primary btn-sm" id="ps-action-btn" disabled>Generate PDF</button>
                </div>
            </div>
            <div class="page-sorter-grid" id="ps-grid"></div>
        `;

        this.grid = this.container.querySelector('#ps-grid');
        this.titleEl = this.container.querySelector('#ps-title');
        this.actionBtn = this.container.querySelector('#ps-action-btn');

        this.actionBtn.addEventListener('click', () => this.handleProcess());

        if (this.mode === 'extract') {
            const selectAllBtn = this.container.querySelector('#ps-select-all');
            selectAllBtn.addEventListener('click', () => {
                const allSelected = this.pages.every(p => p.selected);
                this.pages.forEach(p => p.selected = !allSelected);
                this.updateGridVisuals();
            });
        }
    }

    show() {
        this.container.classList.add('active');
    }

    hide() {
        this.container.classList.remove('active');
        this.grid.innerHTML = '';
        this.pdfDocument = null;
        this.pages = [];
    }

    async loadPdf(arrayBuffer) {
        this.show();
        this.titleEl.textContent = 'Parsing PDF...';
        this.actionBtn.disabled = true;

        try {
            this.pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = this.pdfDocument.numPages;
            
            this.pages = Array.from({ length: numPages }, (_, i) => ({
                originalIndex: i + 1,
                deleted: false,
                selected: false, // Default unselected for extract
                rotation: 0      // Rotation in degrees (0, 90, 180, 270)
            }));

            this.titleEl.textContent = `Processing ${numPages} pages...`;
            
            await this.renderThumbnails();

            if ((this.mode === 'rearrange' || this.mode === 'organize') && window.Sortable) {
                new Sortable(this.grid, {
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    onEnd: (evt) => {
                        // Reorder the pages array
                        const itemEl = this.pages.splice(evt.oldIndex, 1)[0];
                        this.pages.splice(evt.newIndex, 0, itemEl);
                        this.updateBadges();
                    }
                });
            }

            this.actionBtn.disabled = false;
            this.updateTitle();

        } catch (err) {
            console.error('PageSorter Error:', err);
            Toast.show('Failed to load PDF preview', 'error');
            this.titleEl.textContent = 'Error loading preview';
        }
    }

    async renderThumbnails() {
        this.grid.innerHTML = '';

        // Render thumbnails in batches to prevent UI freezing
        for (let i = 0; i < this.pages.length; i++) {
            const pageData = this.pages[i];
            const item = document.createElement('div');
            item.className = `ps-item mode-${this.mode}`;
            item.dataset.index = i;

            const badge = document.createElement('div');
            badge.className = 'ps-badge';
            badge.textContent = i + 1;

            const canvas = document.createElement('canvas');
            item.appendChild(canvas);
            item.appendChild(badge);

            if (this.mode === 'extract') {
                const cb = document.createElement('div');
                cb.className = 'ps-checkbox';
                cb.innerHTML = '<i data-lucide="check"></i>';
                item.appendChild(cb);
            }

            if (this.mode === 'organize') {
                const controls = document.createElement('div');
                controls.className = 'ps-item-controls';
                
                const rotateBtn = document.createElement('button');
                rotateBtn.className = 'ps-ctrl-btn ps-rotate-btn';
                rotateBtn.innerHTML = '<i data-lucide="rotate-cw"></i>';
                rotateBtn.title = 'Rotate Clockwise';
                rotateBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    pageData.rotation = (pageData.rotation + 90) % 360;
                    canvas.style.transform = `rotate(${pageData.rotation}deg)`;
                    canvas.style.transition = 'transform 0.2s ease';
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'ps-ctrl-btn ps-delete-btn';
                deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
                deleteBtn.title = 'Delete Page';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    pageData.deleted = !pageData.deleted;
                    item.classList.toggle('deleted', pageData.deleted);
                    this.updateTitle();
                });

                controls.appendChild(rotateBtn);
                controls.appendChild(deleteBtn);
                item.appendChild(controls);
            }

            this.grid.appendChild(item);

            item.addEventListener('click', () => this.handleItemClick(pageData, item));

            // Async render
            this.renderCanvas(pageData.originalIndex, canvas);
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async renderCanvas(pageNum, canvas) {
        const page = await this.pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.5 }); // Low res for thumbnails
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
    }

    handleItemClick(pageData, element) {
        if (this.mode === 'remove') {
            pageData.deleted = !pageData.deleted;
            if (pageData.deleted) {
                element.classList.add('deleted');
            } else {
                element.classList.remove('deleted');
            }
        } else if (this.mode === 'extract') {
            pageData.selected = !pageData.selected;
            if (pageData.selected) {
                element.classList.add('selected');
            } else {
                element.classList.remove('selected');
            }
        }
        this.updateTitle();
    }

    updateGridVisuals() {
        const items = this.grid.querySelectorAll('.ps-item');
        items.forEach((item, index) => {
            const pageData = this.pages[index];
            if (this.mode === 'extract') {
                item.classList.toggle('selected', pageData.selected);
            }
        });
        this.updateTitle();
    }

    updateBadges() {
        const badges = this.grid.querySelectorAll('.ps-badge');
        badges.forEach((b, i) => b.textContent = i + 1);
    }

    updateTitle() {
        if (this.mode === 'remove') {
            const remaining = this.pages.filter(p => !p.deleted).length;
            this.titleEl.textContent = `PDF with ${remaining} pages`;
            this.actionBtn.disabled = remaining === 0;
        } else if (this.mode === 'extract') {
            const selected = this.pages.filter(p => p.selected).length;
            this.titleEl.textContent = `${selected} pages selected`;
            this.actionBtn.disabled = selected === 0;
        } else if (this.mode === 'organize') {
            const remaining = this.pages.filter(p => !p.deleted).length;
            this.titleEl.textContent = `Organize PDF: ${remaining} pages remaining`;
            this.actionBtn.disabled = remaining === 0;
        } else {
            this.titleEl.textContent = `Drag pages to rearrange`;
        }
    }

    handleProcess() {
        // Prepare array of 0-indexed page numbers to keep
        let pagesToKeep = [];

        if (this.mode === 'remove') {
            pagesToKeep = this.pages.filter(p => !p.deleted).map(p => p.originalIndex - 1);
        } else if (this.mode === 'extract') {
            pagesToKeep = this.pages.filter(p => p.selected).map(p => p.originalIndex - 1);
        } else if (this.mode === 'rearrange') {
            pagesToKeep = this.pages.map(p => p.originalIndex - 1);
        } else if (this.mode === 'organize') {
            // Keep rotation data
            pagesToKeep = this.pages.filter(p => !p.deleted).map(p => ({
                index: p.originalIndex - 1,
                rotation: p.rotation
            }));
        }

        this.onProcess(pagesToKeep);
    }
}

export default PageSorter;
