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

const ICONS = {
    error:   'fa-solid fa-circle-xmark',
    success: 'fa-solid fa-circle-check',
    info:    'fa-solid fa-circle-info',
    warning: 'fa-solid fa-triangle-exclamation'
};

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
    const icon = ICONS[type] || ICONS.info;
    const title = TITLES[type] || 'Notice';

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="toast-icon"><i class="${icon}"></i></div>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Dismiss notification">
            <i class="fa-solid fa-xmark"></i>
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
