/**
 * PDF Merger Application
 * Client-side PDF merging using PDF-lib
 * All processing happens in the browser for privacy and security
 */

class PDFMerger {
    constructor() {
        this.files = [];
        this.isProcessing = false;
        this.mergedPdfBlob = null;
        this.maxFileSize = 50 * 1024 * 1024; // 50MB total limit
        this.maxIndividualFileSize = 25 * 1024 * 1024; // 25MB per file
        this.dragCounter = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
    }

    initializeElements() {
        // Main sections
        this.uploadSection = document.getElementById('uploadSection');
        this.fileListSection = document.getElementById('fileListSection');
        this.progressSection = document.getElementById('progressSection');
        this.resultSection = document.getElementById('resultSection');
        this.errorSection = document.getElementById('errorSection');
        
        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.uploadOverlay = document.getElementById('uploadOverlay');
        this.uploadButton = document.getElementById('uploadButton');
        this.fileInput = document.getElementById('fileInput');
        
        // File list elements
        this.fileList = document.getElementById('fileList');
        this.clearAllButton = document.getElementById('clearAllButton');
        this.mergeButton = document.getElementById('mergeButton');
        
        // Progress elements
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.progressPercent = document.getElementById('progressPercent');
        this.cancelButton = document.getElementById('cancelButton');
        
        // Result elements
        this.downloadButton = document.getElementById('downloadButton');
        this.startOverButton = document.getElementById('startOverButton');
        
        // Error elements
        this.errorMessage = document.getElementById('errorMessage');
        this.retryButton = document.getElementById('retryButton');
        this.resetButton = document.getElementById('resetButton');
    }

    bindEvents() {
        // Upload area events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
        
        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        
        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // File management buttons
        this.clearAllButton.addEventListener('click', () => this.clearAllFiles());
        this.mergeButton.addEventListener('click', () => this.mergeFiles());
        
        // Progress controls
        this.cancelButton.addEventListener('click', () => this.cancelProcessing());
        
        // Result actions
        this.downloadButton.addEventListener('click', () => this.downloadMergedPDF());
        this.startOverButton.addEventListener('click', () => this.startOver());
        
        // Error actions
        this.retryButton.addEventListener('click', () => this.retryOperation());
        this.resetButton.addEventListener('click', () => this.resetApplication());
        
        // Prevent default drag behavior on document
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    // File Selection and Validation
    handleFileSelect(fileList) {
        const files = Array.from(fileList);
        const validFiles = [];
        const errors = [];

        for (const file of files) {
            const validation = this.validateFile(file);
            if (validation.isValid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        }

        if (validFiles.length > 0) {
            this.addFiles(validFiles);
        }

        if (errors.length > 0) {
            this.showError(`Alguns arquivos não puderam ser adicionados:\n${errors.join('\n')}`);
        }

        // Reset file input
        this.fileInput.value = '';
    }

    validateFile(file) {
        // Check file type
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            return {
                isValid: false,
                error: 'Apenas arquivos PDF são aceitos'
            };
        }

        // Check individual file size
        if (file.size > this.maxIndividualFileSize) {
            return {
                isValid: false,
                error: `Arquivo muito grande (máximo ${this.formatFileSize(this.maxIndividualFileSize)})`
            };
        }

        // Check total size
        const currentTotalSize = this.files.reduce((sum, f) => sum + f.file.size, 0);
        if (currentTotalSize + file.size > this.maxFileSize) {
            return {
                isValid: false,
                error: `Tamanho total excederia o limite de ${this.formatFileSize(this.maxFileSize)}`
            };
        }

        // Check if file already exists
        if (this.files.some(f => f.file.name === file.name && f.file.size === file.size)) {
            return {
                isValid: false,
                error: 'Arquivo já foi adicionado'
            };
        }

        return { isValid: true };
    }

    addFiles(files) {
        for (const file of files) {
            const fileObj = {
                id: this.generateId(),
                file: file,
                name: file.name,
                size: file.size,
                status: 'pending'
            };
            this.files.push(fileObj);
        }
        
        this.updateUI();
        this.renderFileList();
    }

    // Drag and Drop Handlers
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDragEnter(e) {
        e.preventDefault();
        this.dragCounter++;
        if (this.dragCounter === 1) {
            this.uploadArea.classList.add('drag-over');
            this.uploadOverlay.classList.add('show');
        }
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dragCounter--;
        if (this.dragCounter === 0) {
            this.uploadArea.classList.remove('drag-over');
            this.uploadOverlay.classList.remove('show');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.dragCounter = 0;
        this.uploadArea.classList.remove('drag-over');
        this.uploadOverlay.classList.remove('show');
        
        const files = Array.from(e.dataTransfer.files);
        this.handleFileSelect(files);
    }

    // File Management
    removeFile(fileId) {
        this.files = this.files.filter(f => f.id !== fileId);
        this.updateUI();
        this.renderFileList();
    }

    clearAllFiles() {
        this.files = [];
        this.updateUI();
        this.renderFileList();
    }

    reorderFiles(fromIndex, toIndex) {
        const file = this.files.splice(fromIndex, 1)[0];
        this.files.splice(toIndex, 0, file);
        this.renderFileList();
    }

    // UI Rendering
    renderFileList() {
        if (this.files.length === 0) {
            this.fileList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    <p>Nenhum arquivo selecionado</p>
                </div>
            `;
            return;
        }

        this.fileList.innerHTML = this.files.map((file, index) => `
            <div class="file-item" data-file-id="${file.id}" data-index="${index}" draggable="true">
                <div class="file-icon">📄</div>
                <div class="file-info">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                </div>
                <div class="file-status ${file.status}">
                    ${this.getStatusIcon(file.status)} ${this.getStatusText(file.status)}
                </div>
                <button class="file-remove" onclick="app.removeFile('${file.id}')" title="Remover arquivo">
                    ×
                </button>
            </div>
        `).join('');

        this.bindFileListEvents();
    }

    bindFileListEvents() {
        const fileItems = this.fileList.querySelectorAll('.file-item');
        
        fileItems.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleFileDragStart(e));
            item.addEventListener('dragover', (e) => this.handleFileDragOver(e));
            item.addEventListener('drop', (e) => this.handleFileDrop(e));
            item.addEventListener('dragend', (e) => this.handleFileDragEnd(e));
        });
    }

    handleFileDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
        e.target.classList.add('dragging');
    }

    handleFileDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleFileDrop(e) {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = parseInt(e.currentTarget.dataset.index);
        
        if (fromIndex !== toIndex) {
            this.reorderFiles(fromIndex, toIndex);
        }
    }

    handleFileDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    // PDF Processing
    async mergeFiles() {
        if (this.files.length === 0 || this.isProcessing) return;

        this.isProcessing = true;
        this.showProgress();
        this.updateProgress(0, 'Iniciando processamento...');

        try {
            // Create new PDF document
            const mergedPdf = await PDFLib.PDFDocument.create();
            
            for (let i = 0; i < this.files.length; i++) {
                const file = this.files[i];
                const progress = (i / this.files.length) * 100;
                
                this.updateProgress(progress, `Processando ${file.name}...`);
                this.updateFileStatus(file.id, 'processing');

                try {
                    // Read file as array buffer
                    const arrayBuffer = await this.fileToArrayBuffer(file.file);
                    
                    // Load PDF document
                    const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                    
                    // Get all pages
                    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    
                    // Add pages to merged PDF
                    pages.forEach(page => mergedPdf.addPage(page));
                    
                    this.updateFileStatus(file.id, 'complete');
                    
                } catch (error) {
                    console.error(`Error processing ${file.name}:`, error);
                    this.updateFileStatus(file.id, 'error');
                    throw new Error(`Erro ao processar ${file.name}: ${error.message}`);
                }
            }

            this.updateProgress(90, 'Finalizando PDF...');

            // Save merged PDF
            const pdfBytes = await mergedPdf.save();
            this.mergedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

            this.updateProgress(100, 'Concluído!');
            
            setTimeout(() => {
                this.showResult();
                this.isProcessing = false;
            }, 500);

        } catch (error) {
            console.error('Merge error:', error);
            this.isProcessing = false;
            this.showError(`Erro ao mesclar PDFs: ${error.message}`);
        }
    }

    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    updateFileStatus(fileId, status) {
        const file = this.files.find(f => f.id === fileId);
        if (file) {
            file.status = status;
            this.renderFileList();
        }
    }

    cancelProcessing() {
        this.isProcessing = false;
        this.resetApplication();
    }

    // Download
    downloadMergedPDF() {
        if (!this.mergedPdfBlob) return;

        const url = URL.createObjectURL(this.mergedPdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.generateMergedFilename();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Clean up
        setTimeout(() => {
            this.cleanup();
        }, 1000);
    }

    generateMergedFilename() {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        return `merged-pdf-${timestamp}.pdf`;
    }

    // UI State Management
    updateUI() {
        const hasFiles = this.files.length > 0;
        const canMerge = hasFiles && !this.isProcessing;

        // Toggle sections
        this.fileListSection.style.display = hasFiles ? 'block' : 'none';
        
        // Update buttons
        this.mergeButton.disabled = !canMerge || this.files.length < 1;
        this.clearAllButton.disabled = !hasFiles;
    }

    showProgress() {
        this.hideAllSections();
        this.progressSection.style.display = 'block';
    }

    showResult() {
        this.hideAllSections();
        this.resultSection.style.display = 'block';
    }

    showError(message) {
        this.hideAllSections();
        this.errorSection.style.display = 'block';
        this.errorMessage.textContent = message;
    }

    hideAllSections() {
        this.uploadSection.style.display = 'none';
        this.fileListSection.style.display = 'none';
        this.progressSection.style.display = 'none';
        this.resultSection.style.display = 'none';
        this.errorSection.style.display = 'none';
    }

    updateProgress(percent, text) {
        this.progressFill.style.width = `${percent}%`;
        this.progressPercent.textContent = `${Math.round(percent)}%`;
        this.progressText.textContent = text;
    }

    // Application Control
    startOver() {
        this.resetApplication();
    }

    retryOperation() {
        this.hideAllSections();
        this.uploadSection.style.display = 'block';
        this.updateUI();
    }

    resetApplication() {
        this.files = [];
        this.isProcessing = false;
        this.cleanup();
        
        this.hideAllSections();
        this.uploadSection.style.display = 'block';
        this.updateUI();
        this.renderFileList();
    }

    cleanup() {
        if (this.mergedPdfBlob) {
            URL.revokeObjectURL(this.mergedPdfBlob);
            this.mergedPdfBlob = null;
        }
        
        // Reset file statuses
        this.files.forEach(file => {
            if (file.status !== 'pending') {
                file.status = 'pending';
            }
        });
    }

    // Utility Functions
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getStatusIcon(status) {
        const icons = {
            pending: '⏳',
            processing: '🔄',
            complete: '✅',
            error: '❌'
        };
        return icons[status] || '⏳';
    }

    getStatusText(status) {
        const texts = {
            pending: 'Aguardando',
            processing: 'Processando',
            complete: 'Concluído',
            error: 'Erro'
        };
        return texts[status] || 'Aguardando';
    }
}

// Browser Compatibility Check
function checkBrowserCompatibility() {
    const requiredFeatures = [
        'FileReader' in window,
        'Blob' in window,
        'URL' in window && 'createObjectURL' in URL,
        'Promise' in window,
        'fetch' in window
    ];

    const isCompatible = requiredFeatures.every(feature => feature);
    
    if (!isCompatible) {
        document.body.innerHTML = `
            <div style="max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                <h1 style="color: #ef4444;">Navegador não compatível</h1>
                <p>Este aplicativo requer um navegador moderno com suporte a:</p>
                <ul style="text-align: left; margin: 20px 0;">
                    <li>File API</li>
                    <li>Blob API</li>
                    <li>URL API</li>
                    <li>Promises</li>
                    <li>Fetch API</li>
                </ul>
                <p>Por favor, atualize seu navegador ou use:</p>
                <p><strong>Chrome 80+, Firefox 75+, Safari 13+, Edge 80+</strong></p>
            </div>
        `;
        return false;
    }
    
    return true;
}

// Initialize Application
let app;

document.addEventListener('DOMContentLoaded', () => {
    if (checkBrowserCompatibility()) {
        // Check if PDF-lib is loaded
        if (typeof PDFLib === 'undefined') {
            document.body.innerHTML = `
                <div style="max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                    <h1 style="color: #ef4444;">Erro de Carregamento</h1>
                    <p>Não foi possível carregar a biblioteca PDF-lib.</p>
                    <p>Verifique sua conexão com a internet e recarregue a página.</p>
                    <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Recarregar Página
                    </button>
                </div>
            `;
            return;
        }
        
        app = new PDFMerger();
        console.log('PDF Merger initialized successfully');
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (app && !app.isProcessing) {
        app.showError('Ocorreu um erro inesperado. Por favor, recarregue a página.');
    }
});

// Prevent memory leaks on page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.cleanup();
    }
});
