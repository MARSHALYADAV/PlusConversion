/**
 * TOAST NOTIFICATION COMPONENT
 * =============================
 * A self-contained, zero-dependency toast system.
 *
 * Usage (import in any page script):
 *   import Toast from '../components/toast.js';
 *   Toast.show('File too large', 'error');
 *   Toast.show('Merged successfully!', 'success');
 *   Toast.show('Processing...', 'info');
 *
 * Types: 'error' | 'success' | 'info' | 'warning'
 *
 * WHY NOT alert()?
 * alert() blocks the browser thread and looks terrible.
 * This component auto-dismisses after 4s, stacks neatly, and matches our design system.
 */

// Inline SVG icons for each toast type — no CDN or data-lucide needed
const ICONS = {
    error:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    info:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

const X_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

const TITLES = {
    error:   'Error',
    success: 'Done',
    info:    'Info',
    warning: 'Warning'
};

// Auto-create the toast container once when the module is first imported
let container = null;

function getContainer() {
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.setAttribute('role', 'log');
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Show a toast notification.
 *
 * @param {string} message  - The message body to display
 * @param {'error'|'success'|'info'|'warning'} type - Toast colour/icon variant
 * @param {number} duration - Auto-dismiss delay in ms (default 4000)
 */
function show(message, type = 'info', duration = 4000) {
    const c = getContainer();
    const iconSvg = ICONS[type] || ICONS.info;
    const title = TITLES[type] || 'Notice';

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="toast-icon">${iconSvg}</div>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Dismiss notification">
            ${X_ICON}
        </button>
    `;

    // Dismiss on close button click
    toast.querySelector('.toast-close').addEventListener('click', () => dismiss(toast));

    c.appendChild(toast);

    // Auto-dismiss
    const timer = setTimeout(() => dismiss(toast), duration);

    // Pause timer on hover (user is reading it)
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => setTimeout(() => dismiss(toast), 1500));
}

/**
 * Slide the toast out and remove it from the DOM.
 * @param {HTMLElement} toast
 */
function dismiss(toast) {
    if (!toast || !toast.isConnected) return;
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

const Toast = { show };
export default Toast;
