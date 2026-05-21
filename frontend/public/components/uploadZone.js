/**
 * PlusConversion - Reusable Upload Zone Component
 * Encapsulates file drag-and-drop, selection, validations, lists, and visual states.
 */

export function initUploadZone({
    dropZoneEl,
    fileInputEl,
    browseBtnEl,
    fileListEl,
    onFilesAdded,
    onFileRemoved,
    maxSizeMB = 50,
    multiple = false
}) {
    if (!dropZoneEl) return null;
    
    let files = [];
    
    // Configure input behavior
    if (fileInputEl) {
        fileInputEl.multiple = multiple;
    }
    
    // Bind click browse buttons
    if (browseBtnEl && fileInputEl) {
        browseBtnEl.addEventListener('click', (e) => {
            e.preventDefault();
            fileInputEl.click();
        });
        
        fileInputEl.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleAddedFiles(e.target.files);
            }
        });
    }
    
    // Drag & Drop event bindings
    dropZoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZoneEl.classList.add('dragover');
    });
    
    dropZoneEl.addEventListener('dragleave', () => {
        dropZoneEl.classList.remove('dragover');
    });
    
    dropZoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZoneEl.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleAddedFiles(e.dataTransfer.files);
        }
    });
    
    function handleAddedFiles(incomingFiles) {
        const fileArray = Array.from(incomingFiles);
        const validFiles = fileArray.filter(file => {
            if (file.size > maxSizeMB * 1024 * 1024) {
                alert(`File "${file.name}" exceeds the maximum limit of ${maxSizeMB}MB.`);
                return false;
            }
            return true;
        });
        
        if (validFiles.length === 0) return;
        
        if (multiple) {
            files = [...files, ...validFiles];
        } else {
            files = [validFiles[0]];
        }
        
        if (onFilesAdded) {
            onFilesAdded(multiple ? validFiles : [validFiles[0]], files);
        }
        
        renderFileList();
    }
    
    function renderFileList() {
        if (!fileListEl) return;
        
        if (files.length === 0) {
            fileListEl.classList.add('hidden');
            fileListEl.innerHTML = '';
            return;
        }
        
        fileListEl.classList.remove('hidden');
        fileListEl.innerHTML = files.map((file, i) => {
            const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic');
            const isImage = file.type.startsWith('image/') || isHeic;
            const thumbHtml = isImage 
                ? `<div class="file-thumb-placeholder"><i data-lucide="image"></i></div>` 
                : `<div class="file-thumb-placeholder"><i data-lucide="file-text"></i></div>`;
                
            return `
                <div class="file-item animate-fade-in" data-index="${i}">
                    ${thumbHtml}
                    <div class="file-info">
                        <span class="file-name" title="${file.name}">${file.name}</span>
                        <span class="file-meta">${formatBytes(file.size)}</span>
                    </div>
                    <button class="remove-btn" type="button" aria-label="Remove file">×</button>
                </div>
            `;
        }).join('');
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Attach click listeners
        fileListEl.querySelectorAll('.remove-btn').forEach((btn, idx) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFile(idx);
            });
        });
    }
    
    function removeFile(index) {
        const removed = files.splice(index, 1)[0];
        if (onFileRemoved) {
            onFileRemoved(removed, index, files);
        }
        renderFileList();
        if (fileInputEl) {
            fileInputEl.value = '';
        }
    }
    
    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }
    
    // Return Public Handle
    return {
        getFiles: () => files,
        clear: () => {
            files = [];
            if (fileInputEl) fileInputEl.value = '';
            renderFileList();
        },
        setFiles: (newFiles) => {
            files = [...newFiles];
            renderFileList();
        }
    };
}
