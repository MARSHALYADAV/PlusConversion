/**
 * PROGRESS UI COMPONENT
 * =====================
 * Manages the three visual states of a tool page:
 *   1. UPLOAD  — dropzone + settings visible
 *   2. PROCESS — spinner/progress bar shown, upload hidden
 *   3. RESULT  — download card shown, upload/progress hidden
 *
 * Usage:
 *   import ProgressUI from '../components/progressUI.js';
 *
 *   const ui = new ProgressUI({
 *       uploadSection:     document.getElementById('upload-section'),
 *       processingSection: document.getElementById('processing-section'),
 *       resultSection:     document.getElementById('result-section'),
 *       progressFill:      document.getElementById('progress-fill'),
 *       progressLabel:     document.getElementById('progress-label'),
 *       processingText:    document.getElementById('processing-text')
 *   });
 *
 *   ui.showProcessing('Merging your PDFs...');
 *   ui.setProgress(60);   // 0–100
 *   ui.showResult();
 *   ui.reset();
 */

export default class ProgressUI {
    /**
     * @param {object} opts
     * @param {HTMLElement} opts.uploadSection     - The section shown during idle/upload state
     * @param {HTMLElement} opts.processingSection - Spinner + progress bar section
     * @param {HTMLElement} opts.resultSection     - Download result section
     * @param {HTMLElement} [opts.progressFill]    - The .progress-bar-fill element
     * @param {HTMLElement} [opts.progressLabel]   - Label showing percentage text
     * @param {HTMLElement} [opts.processingText]  - Dynamic processing status text
     */
    constructor({ uploadSection, processingSection, resultSection, progressFill, progressLabel, processingText }) {
        this.uploadSection     = uploadSection;
        this.processingSection = processingSection;
        this.resultSection     = resultSection;
        this.progressFill      = progressFill;
        this.progressLabel     = progressLabel;
        this.processingText    = processingText;

        this._currentProgress = 0;
    }

    /**
     * Switch to the processing state: hide upload UI, show spinner + progress bar.
     * @param {string} message - Status text to display (e.g. "Merging PDFs...")
     */
    showProcessing(message = 'Processing your file…') {
        this._hide(this.uploadSection);
        this._hide(this.resultSection);
        this._show(this.processingSection);

        if (this.processingText) this.processingText.textContent = message;
        this.setProgress(0);

        // Simulate early progress to give user visual feedback immediately
        // The real progress update comes from the API response.
        this._simulateEarlyProgress();
    }

    /**
     * Update the progress bar fill (0–100).
     * @param {number} percent
     */
    setProgress(percent) {
        this._currentProgress = Math.max(0, Math.min(100, percent));
        if (this.progressFill) {
            this.progressFill.style.width = `${this._currentProgress}%`;
        }
        if (this.progressLabel) {
            this.progressLabel.textContent = `${Math.round(this._currentProgress)}%`;
        }
    }

    /**
     * Switch to the result state: hide processing, show result card.
     */
    showResult() {
        this._hide(this.processingSection);
        this._hide(this.uploadSection);
        this._show(this.resultSection);
        this.setProgress(100);
    }

    /**
     * Reset back to the upload state (for "Convert Another" button).
     */
    reset() {
        this._hide(this.processingSection);
        this._hide(this.resultSection);
        this._show(this.uploadSection);
        this.setProgress(0);
        if (this.processingText) this.processingText.textContent = 'Processing…';
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Simulate progress climbing to ~80% while we wait for the server.
     * This gives the user confidence something is happening even though we
     * can't track real server-side progress over a simple POST request.
     *
     * The bar never reaches 100% automatically — that only happens when
     * showResult() is called after a real success.
     */
    _simulateEarlyProgress() {
        clearInterval(this._simTimer);
        let val = 0;

        this._simTimer = setInterval(() => {
            // Logarithmic slowdown — fast at first, crawls toward 80%
            const remaining = 80 - val;
            val += remaining * 0.08;

            if (val >= 79) {
                clearInterval(this._simTimer);
                val = 79;
            }
            this.setProgress(val);
        }, 250);
    }

    _show(el) {
        if (el) {
            el.classList.remove('hidden');
            if (el.classList.contains('processing-overlay')) el.classList.add('visible');
            if (el.classList.contains('result-card')) el.classList.add('visible');
        }
    }

    _hide(el) {
        if (el) {
            el.classList.add('hidden');
            el.classList.remove('visible');
        }
    }
}
