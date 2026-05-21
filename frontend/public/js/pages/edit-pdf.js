import { applyPageIcons } from '../utils/pageIcons.js';
import { initNavbar }   from '../components/navbar.js';
import Toast            from '../components/toast.js';
import DropZone         from '../components/dropzone.js';
import ProgressUI       from '../components/progressUI.js';
import ResultCard       from '../components/resultCard.js';
import FileList         from '../components/fileList.js';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar('edit-pdf');
    applyPageIcons();

    const ui = new ProgressUI({
        uploadSection:     document.getElementById('upload-section'),
        processingSection: document.getElementById('processing-section'),
        resultSection:     document.getElementById('result-section'),
        progressFill:      document.getElementById('progress-fill'),
        processingText:    document.getElementById('processing-text'),
    });

    let selectedFile = null;
    let pdfDocJs = null;
    let currentPageIndex = 0;
    let totalPages = 0;
    let currentScale = 1.3;

    // Annotation memory store: keys are page indices (0, 1, 2...)
    // Value: Array of annotation objects
    const annotationsStore = {};

    // Current state attributes
    let activeTool = 'select'; // 'select' | 'text' | 'draw' | 'highlighter' | 'rect' | 'circle' | 'image'
    let strokeColor = '#000000';
    let brushSize = 4;

    // Drawing variables
    let isDrawing = false;
    let drawPoints = [];
    let shapeStart = null;

    // DOM Elements
    const workspace = document.getElementById('editor-workspace');
    const bgCanvas = document.getElementById('pdf-render-canvas');
    const fgCanvas = document.getElementById('drawing-overlay-canvas');
    const fgCtx = fgCanvas.getContext('2d');
    const htmlLayer = document.getElementById('html-elements-layer');
    const sidebarContainer = document.getElementById('thumbnails-container');
    const pageNumDisplay = document.getElementById('page-num-display');
    const saveBtn = document.getElementById('save-edits-btn');

    // Setup DropZone
    new DropZone({
        containerEl: document.getElementById('drop-zone'),
        inputEl:     document.getElementById('file-input'),
        browseBtn:   document.getElementById('browse-btn'),
        accept:      ['.pdf'],
        multiple:    false,
        maxSizeMb:   200,
        onFiles: async (files) => {
            if (files && files.length > 0) {
                selectedFile = files[0];
                await loadPdfForEditing(selectedFile);
            }
        }
    });

    const fileList = new FileList({
        containerEl: document.getElementById('file-list'),
        onUpdate: () => {}
    });

    const rc = new ResultCard({
        containerEl: document.getElementById('result-section'),
        onReset: () => {
            selectedFile = null;
            pdfDocJs = null;
            currentPageIndex = 0;
            totalPages = 0;
            Object.keys(annotationsStore).forEach(k => delete annotationsStore[k]);
            sidebarContainer.innerHTML = '';
            htmlLayer.innerHTML = '';
            workspace.classList.add('hidden');
            ui.reset();
        }
    });

    /**
     * Load PDF using PDF.js and initialize workspace
     */
    async function loadPdfForEditing(file) {
        try {
            ui.showProcessing('Loading PDF editor workspace…');
            const arrayBuffer = await file.arrayBuffer();
            pdfDocJs = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            totalPages = pdfDocJs.numPages;
            currentPageIndex = 0;

            // Initialize stores
            for (let i = 0; i < totalPages; i++) {
                annotationsStore[i] = [];
            }

            // Hide upload, display workspace
            document.getElementById('upload-section').classList.add('hidden');
            workspace.classList.remove('hidden');
            ui.reset();

            // Render visual preview pages sidebar
            await renderSidebarThumbnails();

            // Load first page
            await loadPage(0);
        } catch (err) {
            ui.reset();
            Toast.show('Failed to parse PDF document for editing.', 'error');
            console.error(err);
        }
    }

    /**
     * Render sidebar thumbnail listings
     */
    async function renderSidebarThumbnails() {
        sidebarContainer.innerHTML = '';
        for (let i = 0; i < totalPages; i++) {
            const div = document.createElement('div');
            div.className = `thumbnail-item ${i === 0 ? 'active' : ''}`;
            div.dataset.index = i;
            div.innerHTML = `
                <div style="font-weight: 500; font-size: 0.8rem; margin-bottom: 0.25rem;">Page ${i + 1}</div>
                <div class="thumb-canvas-wrap" style="background: white; border: 1px solid rgba(0,0,0,0.1); border-radius: 2px; width: 100px; height: 130px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin: 0 auto;">
                    <canvas id="thumb-canvas-${i}" style="max-width: 100%; max-height: 100%; display: block;"></canvas>
                </div>
            `;
            sidebarContainer.appendChild(div);

            div.addEventListener('click', async () => {
                document.querySelectorAll('.thumbnail-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                await saveCurrentPageHtmlAnnotations();
                await loadPage(i);
            });

            // Asynchronously draw thumbnail page
            renderThumbnail(i);
        }
    }

    /**
     * Draw individual page thumbnail
     */
    async function renderThumbnail(pageIdx) {
        try {
            const page = await pdfDocJs.getPage(pageIdx + 1);
            const canvas = document.getElementById(`thumb-canvas-${pageIdx}`);
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const viewport = page.getViewport({ scale: 0.2 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        } catch (err) {
            console.error('Thumbnail render error:', err);
        }
    }

    /**
     * Load & render specific page to workspace canvas
     */
    async function loadPage(pageIdx) {
        currentPageIndex = pageIdx;
        pageNumDisplay.textContent = `Page ${pageIdx + 1} of ${totalPages}`;

        document.getElementById('prev-page-btn').disabled = pageIdx === 0;
        document.getElementById('next-page-btn').disabled = pageIdx === totalPages - 1;

        // Clear existing workspace overlays
        htmlLayer.innerHTML = '';
        fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);

        try {
            const page = await pdfDocJs.getPage(pageIdx + 1);
            const viewport = page.getViewport({ scale: currentScale });

            bgCanvas.width = viewport.width;
            bgCanvas.height = viewport.height;

            fgCanvas.width = viewport.width;
            fgCanvas.height = viewport.height;

            const renderContext = {
                canvasContext: bgCanvas.getContext('2d'),
                viewport: viewport
            };

            await page.render(renderContext).promise;

            // Re-draw saved drawing & shape overlays for this page
            redrawSavedAnnotationsOnOverlayCanvas();

            // Re-render saved text & image HTML overlays
            redrawSavedHtmlOverlays();
        } catch (err) {
            console.error('Failed to load page:', err);
            Toast.show('Error rendering page.', 'error');
        }
    }

    /**
     * Redraw vector drawing & shapes from store onto fgCanvas
     */
    function redrawSavedAnnotationsOnOverlayCanvas() {
        const list = annotationsStore[currentPageIndex] || [];
        list.forEach(ann => {
            if (ann.type === 'drawing') {
                const pts = ann.points || [];
                if (pts.length < 2) return;
                
                // Convert back from PDF points to Canvas points
                const renderPts = pts.map(p => convertPdfToCanvasPoint(p.x, p.y));
                
                fgCtx.beginPath();
                fgCtx.strokeStyle = ann.color || '#000000';
                fgCtx.lineWidth = parseFloat(ann.thickness) || 2;
                fgCtx.lineCap = 'round';
                fgCtx.globalAlpha = parseFloat(ann.opacity) || 1.0;
                
                fgCtx.moveTo(renderPts[0].x, renderPts[0].y);
                for (let i = 1; i < renderPts.length; i++) {
                    fgCtx.lineTo(renderPts[i].x, renderPts[i].y);
                }
                fgCtx.stroke();
                fgCtx.globalAlpha = 1.0;
            } else if (ann.type === 'shape') {
                // Convert back from PDF point coordinates to Canvas
                const start = convertPdfToCanvasPoint(ann.x, ann.y);
                // Remember PDF coordinates starts from bottom, height must be subtracted
                const width = parseFloat(ann.width) / getScaleX();
                const height = parseFloat(ann.height) / getScaleY();
                const canvasY = start.y - height;

                fgCtx.beginPath();
                fgCtx.strokeStyle = ann.color || '#000000';
                fgCtx.fillStyle = ann.color || '#000000';
                fgCtx.lineWidth = 2;
                fgCtx.globalAlpha = parseFloat(ann.opacity) || 1.0;

                const fill = ann.fill !== false;

                if (ann.shapeType === 'circle') {
                    const radius = width / 2;
                    fgCtx.arc(start.x + radius, canvasY + radius, radius, 0, 2 * Math.PI);
                    if (fill) fgCtx.fill();
                    else fgCtx.stroke();
                } else {
                    if (fill) fgCtx.fillRect(start.x, canvasY, width, height);
                    else fgCtx.strokeRect(start.x, canvasY, width, height);
                }
                fgCtx.globalAlpha = 1.0;
            }
        });
    }

    /**
     * Redraw HTML annotations (text & image overlays)
     */
    function redrawSavedHtmlOverlays() {
        const list = annotationsStore[currentPageIndex] || [];
        list.forEach(ann => {
            if (ann.type === 'text') {
                const canvasPt = convertPdfToCanvasPoint(ann.x, ann.y);
                // Adjust text size based on scale
                const canvasFontSize = parseFloat(ann.fontSize) / getScaleY();
                
                // Remember PDF origin at bottom
                createTextBoxElement(canvasPt.x, canvasPt.y - canvasFontSize, ann.text, ann.color, canvasFontSize);
            } else if (ann.type === 'image') {
                const canvasPt = convertPdfToCanvasPoint(ann.x, ann.y);
                const width = parseFloat(ann.width) / getScaleX();
                const height = parseFloat(ann.height) / getScaleY();
                
                createImageElement(canvasPt.x, canvasPt.y - height, width, height, ann.base64);
            }
        });
    }

    /**
     * Scaling helper variables
     */
    function getScaleX() {
        // Points / Rendered Width
        return (bgCanvas.width / currentScale) / bgCanvas.width * currentScale; // pdf-js fits scaled dimensions exactly
    }

    function getScaleY() {
        return 1.0; 
    }

    /**
     * Convert CSS/Canvas mouse coordinate into PDF point coordinate.
     * PDF coordinate systems:
     *  - bottom-left origin (0, 0)
     *  - standard dimensions in 72 points per inch (A4 is 595 x 842)
     */
    function convertCanvasToPdfPoint(cx, cy) {
        const pdfWidth = bgCanvas.width / currentScale;
        const pdfHeight = bgCanvas.height / currentScale;

        const scaleX = pdfWidth / bgCanvas.width;
        const scaleY = pdfHeight / bgCanvas.height;

        const pdfX = cx * scaleX;
        const pdfY = pdfHeight - (cy * scaleY);

        return { x: pdfX, y: pdfY };
    }

    /**
     * Convert PDF point coordinate back to Canvas/CSS coordinate
     */
    function convertPdfToCanvasPoint(px, py) {
        const pdfWidth = bgCanvas.width / currentScale;
        const pdfHeight = bgCanvas.height / currentScale;

        const scaleX = bgCanvas.width / pdfWidth;
        const scaleY = bgCanvas.height / pdfHeight;

        const cx = px * scaleX;
        const cy = (pdfHeight - py) * scaleY;

        return { x: cx, y: cy };
    }

    /**
     * Save currently rendering editable HTML elements back into the annotationStore
     */
    async function saveCurrentPageHtmlAnnotations() {
        if (!pdfDocJs) return;

        // Filter out existing text and image annotations on this page and rebuild
        annotationsStore[currentPageIndex] = annotationsStore[currentPageIndex].filter(
            ann => ann.type !== 'text' && ann.type !== 'image'
        );

        // Parse textbox elements
        htmlLayer.querySelectorAll('.editor-textbox').forEach(box => {
            const text = box.innerText.trim();
            if (!text) return;

            const rect = box.getBoundingClientRect();
            const parentRect = htmlLayer.getBoundingClientRect();

            const cx = rect.left - parentRect.left;
            const cy = rect.top - parentRect.top;

            const pdfPt = convertCanvasToPdfPoint(cx, cy);
            
            // Re-scale font size back to PDF points
            const cssFontSize = parseFloat(window.getComputedStyle(box).fontSize) || 14;
            const pdfWidth = bgCanvas.width / currentScale;
            const scaleY = pdfWidth / bgCanvas.width; // standard square scale mapping
            const pdfFontSize = cssFontSize * scaleY;

            // Adjust coordinates to match bottom-left PDF text flow
            annotationsStore[currentPageIndex].push({
                type: 'text',
                pageIndex: currentPageIndex,
                text: text,
                x: pdfPt.x,
                y: pdfPt.y - pdfFontSize,
                fontSize: pdfFontSize,
                color: box.style.color || strokeColor,
                opacity: 1.0
            });
        });

        // Parse image elements
        htmlLayer.querySelectorAll('.editor-img-element').forEach(imgWrap => {
            const img = imgWrap.querySelector('img');
            if (!img) return;

            const rect = imgWrap.getBoundingClientRect();
            const parentRect = htmlLayer.getBoundingClientRect();

            const cx = rect.left - parentRect.left;
            const cy = rect.top - parentRect.top;

            const pdfWidth = bgCanvas.width / currentScale;
            const scaleX = pdfWidth / bgCanvas.width;

            const pdfPt = convertCanvasToPdfPoint(cx, cy);
            const pdfW = rect.width * scaleX;
            const pdfH = rect.height * scaleX;

            annotationsStore[currentPageIndex].push({
                type: 'image',
                pageIndex: currentPageIndex,
                base64: img.src,
                x: pdfPt.x,
                y: pdfPt.y - pdfH,
                width: pdfW,
                height: pdfH
            });
        });
    }

    // =============================================================================
    // DRAWING & SHAPE EVENTS
    // =============================================================================

    fgCanvas.addEventListener('mousedown', (e) => {
        if (activeTool === 'select' || activeTool === 'text' || activeTool === 'image') return;

        isDrawing = true;
        const rect = fgCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (activeTool === 'draw' || activeTool === 'highlighter') {
            drawPoints = [{ x, y }];
            fgCtx.beginPath();
            fgCtx.strokeStyle = strokeColor;
            fgCtx.lineWidth = activeTool === 'highlighter' ? brushSize * 3.5 : brushSize;
            fgCtx.lineCap = 'round';
            fgCtx.globalAlpha = activeTool === 'highlighter' ? 0.4 : 1.0;
            fgCtx.moveTo(x, y);
        } else if (activeTool === 'rect' || activeTool === 'circle') {
            shapeStart = { x, y };
        }
    });

    fgCanvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const rect = fgCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (activeTool === 'draw' || activeTool === 'highlighter') {
            drawPoints.push({ x, y });
            fgCtx.lineTo(x, y);
            fgCtx.stroke();
        } else if (activeTool === 'rect' || activeTool === 'circle') {
            // Live drawing shape previews require redrawing existing layers first
            fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
            redrawSavedAnnotationsOnOverlayCanvas();

            fgCtx.beginPath();
            fgCtx.strokeStyle = strokeColor;
            fgCtx.lineWidth = 2;
            fgCtx.globalAlpha = 1.0;

            const w = x - shapeStart.x;
            const h = y - shapeStart.y;

            if (activeTool === 'circle') {
                const radius = Math.sqrt(w*w + h*h) / 2;
                fgCtx.arc(shapeStart.x + w/2, shapeStart.y + h/2, radius, 0, 2*Math.PI);
                fgCtx.stroke();
            } else {
                fgCtx.strokeRect(shapeStart.x, shapeStart.y, w, h);
            }
        }
    });

    fgCanvas.addEventListener('mouseup', (e) => {
        if (!isDrawing) return;
        isDrawing = false;

        const rect = fgCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (activeTool === 'draw' || activeTool === 'highlighter') {
            // Save drawings as PDF points list
            const pdfPoints = drawPoints.map(p => convertCanvasToPdfPoint(p.x, p.y));
            const pdfWidth = bgCanvas.width / currentScale;
            const scaleY = pdfWidth / bgCanvas.width;
            
            annotationsStore[currentPageIndex].push({
                type: 'drawing',
                pageIndex: currentPageIndex,
                points: pdfPoints,
                color: strokeColor,
                thickness: activeTool === 'highlighter' ? brushSize * 3.5 * scaleY : brushSize * scaleY,
                opacity: activeTool === 'highlighter' ? 0.4 : 1.0
            });
        } else if (activeTool === 'rect' || activeTool === 'circle') {
            const w = x - shapeStart.x;
            const h = y - shapeStart.y;
            if (Math.abs(w) < 5 || Math.abs(h) < 5) return;

            // Make coordinates values clean and absolute
            const startX = Math.min(shapeStart.x, x);
            const startY = Math.min(shapeStart.y, y);
            const absW = Math.abs(w);
            const absH = Math.abs(h);

            const pdfStart = convertCanvasToPdfPoint(startX, startY + absH);
            const pdfWidth = bgCanvas.width / currentScale;
            const scaleX = pdfWidth / bgCanvas.width;
            
            annotationsStore[currentPageIndex].push({
                type: 'shape',
                shapeType: activeTool,
                pageIndex: currentPageIndex,
                x: pdfStart.x,
                y: pdfStart.y,
                width: absW * scaleX,
                height: absH * scaleX,
                color: strokeColor,
                fill: false, // stroke outlines are most useful
                opacity: 1.0
            });

            // Re-render clear state
            fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
            redrawSavedAnnotationsOnOverlayCanvas();
        }

        drawPoints = [];
        shapeStart = null;
    });

    // Handle Text Tool Clicks
    fgCanvas.addEventListener('click', (e) => {
        if (activeTool !== 'text') return;

        const rect = fgCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Place textbox in-browser
        createTextBoxElement(x, y - 10, '', strokeColor, 14);
    });

    /**
     * Create floating HTML TextBox element overlay
     */
    function createTextBoxElement(x, y, textVal = '', color = '#000000', size = 14) {
        const box = document.createElement('div');
        box.className = 'editor-textbox';
        box.contentEditable = true;
        box.style.left = `${x}px`;
        box.style.top = `${y}px`;
        box.style.color = color;
        box.style.fontSize = `${size}px`;
        box.innerText = textVal;

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.className = 'element-delete-btn';
        delBtn.innerHTML = '✕';
        delBtn.title = 'Delete Text';
        delBtn.style.pointerEvents = 'auto';
        box.appendChild(delBtn);

        delBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            box.remove();
        });

        // Draggable behavior
        let isDraggingBox = false;
        let dragOffset = { x: 0, y: 0 };

        box.addEventListener('mousedown', (ev) => {
            if (document.activeElement === box) return; // Allow content editing cursor without dragging
            isDraggingBox = true;
            const bRect = box.getBoundingClientRect();
            dragOffset.x = ev.clientX - bRect.left;
            dragOffset.y = ev.clientY - bRect.top;
            ev.preventDefault();
        });

        document.addEventListener('mousemove', (ev) => {
            if (!isDraggingBox) return;
            const parentRect = htmlLayer.getBoundingClientRect();
            let nx = ev.clientX - parentRect.left - dragOffset.x;
            let ny = ev.clientY - parentRect.top - dragOffset.y;

            // Constrain
            nx = Math.max(0, Math.min(parentRect.width - box.offsetWidth, nx));
            ny = Math.max(0, Math.min(parentRect.height - box.offsetHeight, ny));

            box.style.left = `${nx}px`;
            box.style.top = `${ny}px`;
        });

        document.addEventListener('mouseup', () => {
            isDraggingBox = false;
        });

        htmlLayer.appendChild(box);

        if (!textVal) {
            box.focus();
        }
    }

    // =============================================================================
    // IMAGE UPLOAD & INTERACTIVE PLACEMENT
    // =============================================================================

    const imageInput = document.getElementById('image-upload');
    document.getElementById('tool-image')?.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            // Insert centrally
            const cx = (fgCanvas.width / 2) - 80;
            const cy = (fgCanvas.height / 2) - 80;
            createImageElement(cx, cy, 160, 160, dataUrl);
            imageInput.value = ''; // clear input
        };
        reader.readAsDataURL(file);
    });

    /**
     * Create floating HTML image element overlay
     */
    function createImageElement(x, y, w, h, base64) {
        const imgWrap = document.createElement('div');
        imgWrap.className = 'editor-img-element';
        imgWrap.style.left = `${x}px`;
        imgWrap.style.top = `${y}px`;
        imgWrap.style.width = `${w}px`;
        imgWrap.style.height = `${h}px`;

        const img = document.createElement('img');
        img.src = base64;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.display = 'block';
        img.style.pointerEvents = 'none';
        imgWrap.appendChild(img);

        const delBtn = document.createElement('button');
        delBtn.className = 'element-delete-btn';
        delBtn.innerHTML = '✕';
        delBtn.title = 'Delete Image';
        imgWrap.appendChild(delBtn);

        delBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            imgWrap.remove();
        });

        // Draggable & Resizable behavior
        let isDraggingWrap = false;
        let dragOffset = { x: 0, y: 0 };

        imgWrap.addEventListener('mousedown', (ev) => {
            if (ev.target === delBtn) return;
            isDraggingWrap = true;
            const wrapRect = imgWrap.getBoundingClientRect();
            dragOffset.x = ev.clientX - wrapRect.left;
            dragOffset.y = ev.clientY - wrapRect.top;
            ev.preventDefault();
        });

        document.addEventListener('mousemove', (ev) => {
            if (!isDraggingWrap) return;
            const parentRect = htmlLayer.getBoundingClientRect();
            let nx = ev.clientX - parentRect.left - dragOffset.x;
            let ny = ev.clientY - parentRect.top - dragOffset.y;

            nx = Math.max(0, Math.min(parentRect.width - imgWrap.offsetWidth, nx));
            ny = Math.max(0, Math.min(parentRect.height - imgWrap.offsetHeight, ny));

            imgWrap.style.left = `${nx}px`;
            imgWrap.style.top = `${ny}px`;
        });

        document.addEventListener('mouseup', () => {
            isDraggingWrap = false;
        });

        htmlLayer.appendChild(imgWrap);
    }

    // =============================================================================
    // CONTROLS & EVENT BINDINGS
    // =============================================================================

    // Toolbar Tool Selectors
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            activeTool = btn.id.replace('tool-', '');

            // Cursor styling based on active tool
            if (activeTool === 'select') {
                fgCanvas.style.cursor = 'default';
                htmlLayer.style.pointerEvents = 'auto'; // allow text inputs
            } else if (activeTool === 'text') {
                fgCanvas.style.cursor = 'text';
                htmlLayer.style.pointerEvents = 'none'; // click sets text on canvas
            } else if (activeTool === 'image') {
                fgCanvas.style.cursor = 'default';
                htmlLayer.style.pointerEvents = 'auto';
            } else {
                fgCanvas.style.cursor = 'crosshair';
                htmlLayer.style.pointerEvents = 'none'; // block clicks during draw
            }
        });
    });

    // Attribute Color Dots
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
            dot.classList.add('selected');
            strokeColor = dot.dataset.color;
        });
    });

    // Brush Size Slider
    const sizeSlider = document.getElementById('brush-size');
    const sizeValDisplay = document.getElementById('brush-size-val');
    sizeSlider?.addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value) || 4;
        sizeValDisplay.textContent = `${brushSize}px`;
    });

    // Clear Page Drawings
    document.getElementById('clear-page-btn')?.addEventListener('click', () => {
        if (confirm('Clear all visual annotations, text, and images from the current page?')) {
            annotationsStore[currentPageIndex] = [];
            fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
            htmlLayer.innerHTML = '';
            Toast.show('Page annotations cleared.', 'success');
        }
    });

    // Pagination Click Bindings
    document.getElementById('prev-page-btn')?.addEventListener('click', async () => {
        if (currentPageIndex > 0) {
            await saveCurrentPageHtmlAnnotations();
            document.querySelectorAll('.thumbnail-item').forEach(el => el.classList.remove('active'));
            document.querySelector(`.thumbnail-item[data-index="${currentPageIndex - 1}"]`)?.classList.add('active');
            await loadPage(currentPageIndex - 1);
        }
    });

    document.getElementById('next-page-btn')?.addEventListener('click', async () => {
        if (currentPageIndex < totalPages - 1) {
            await saveCurrentPageHtmlAnnotations();
            document.querySelectorAll('.thumbnail-item').forEach(el => el.classList.remove('active'));
            document.querySelector(`.thumbnail-item[data-index="${currentPageIndex + 1}"]`)?.classList.add('active');
            await loadPage(currentPageIndex + 1);
        }
    });

    // =============================================================================
    // SAVE / SUBMIT EDITS API DISPATCH
    // =============================================================================

    saveBtn?.addEventListener('click', async () => {
        if (!selectedFile) return;

        // Save current page HTML overlays first
        await saveCurrentPageHtmlAnnotations();

        // Compile and flatten annotations store
        const finalAnnotationsList = [];
        Object.keys(annotationsStore).forEach(pIdx => {
            const list = annotationsStore[pIdx] || [];
            list.forEach(ann => finalAnnotationsList.push(ann));
        });

        if (finalAnnotationsList.length === 0) {
            Toast.show('No edits or annotations found to save.', 'warning');
            return;
        }

        ui.showProcessing('Compiling and embedding your visual annotations…');

        const form = new FormData();
        form.append('pdf', selectedFile);
        form.append('annotations', JSON.stringify(finalAnnotationsList));

        try {
            const res = await fetch('/api/pdf/edit', {
                method: 'POST',
                body: form
            });

            const result = await res.json();
            if (!res.ok || result.success === false) {
                throw new Error(result.error || result.message || 'Edit compilation failed.');
            }

            const data = result.data || result;
            rc.show(data);
            ui.showResult();
            Toast.show('PDF edited successfully!', 'success');
        } catch (err) {
            ui.reset();
            Toast.show(err.message || 'Failed to edit PDF. Please try again.', 'error');
        }
    });

    initFaq();
});

function initFaq() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });
}
