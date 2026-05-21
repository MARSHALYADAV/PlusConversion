/**
 * pageIcons.js — Inline SVG Icon Injection for Tool Pages
 * =========================================================
 * Replaces all <i data-lucide="..."> tags with inline SVG equivalents
 * immediately after the DOM is ready. Works in Vanilla JS, no CDN needed.
 *
 * Usage (add to any tool page's module script):
 *   import { applyPageIcons } from '../js/utils/pageIcons.js';
 *   applyPageIcons();
 *
 * OR call it in DOMContentLoaded if used as a classic script.
 */

// ─── SVG Library ─────────────────────────────────────────────────────────────
// 24×24 stroke-based Lucide-compatible icons. fill=none, stroke=currentColor.
const ICONS = {
    // Navigation
    'arrow-left':   `<path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>`,
    'arrow-right':  `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`,
    'chevron-down': `<polyline points="6 9 12 15 18 9"/>`,
    'chevron-up':   `<polyline points="18 15 12 9 6 15"/>`,
    'external-link':`<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>`,

    // Status & UI
    'check':        `<polyline points="20 6 9 17 4 12"/>`,
    'check-circle': `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
    'x':            `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
    'x-circle':     `<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>`,
    'alert-circle': `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
    'info':         `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`,
    'zap':          `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
    'loader-2':     `<path d="M21 12a9 9 0 1 1-6.219-8.56"/>`,

    // PDF tools — large 32px usage on tool page headers
    'file-text':    `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>`,
    'merge':        `<path d="M8 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/><path d="M16 6h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4"/><path d="M12 2v20"/><path d="m9 9 3-3 3 3"/><path d="m9 15 3 3 3-3"/>`,
    'scissors':     `<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>`,
    'minimize-2':   `<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>`,
    'rotate-cw':    `<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>`,
    'refresh-cw':   `<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>`,
    'rotate-ccw':   `<path d="M3 2v6h6"/><path d="M21 12a9 9 0 0 0-15-6.7L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/>`,
    'stamp':        `<path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17 13h-1a2.5 2.5 0 0 1-2.5-2.5v-3a2.5 2.5 0 0 0-5 0v3A2.5 2.5 0 0 1 6 13H5a2.5 2.5 0 0 0-1.77 4.26L5 19h14l1.77-1.74A2.5 2.5 0 0 0 19.27 13.73z"/>`,
    'binary':       `<rect x="14" y="14" width="4" height="6" rx="2"/><rect x="6" y="4" width="4" height="6" rx="2"/><path d="M6 20h4"/><path d="M14 10h4"/><path d="M6 14h2v6"/><path d="M14 4h2v6"/>`,
    'crop':         `<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>`,
    'file-image':   `<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"/>`,
    'images':       `<rect x="18" y="3" width="4" height="14" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1" transform="rotate(10 10 7)"/><rect x="2" y="11" width="4" height="14" rx="1" transform="rotate(-10 2 11)"/>`,
    'layout-grid':  `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`,
    'grip-vertical':`<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>`,
    'trash-2':      `<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>`,
    'file-output':  `<path d="M4 2h9l5 5v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><polyline points="13 2 13 8 19 8"/><path d="m9 15 3 3 3-3"/><line x1="12" y1="12" x2="12" y2="18"/>`,
    'download':     `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`,
    'upload':       `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>`,
    'lock':         `<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
    'unlock':       `<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>`,
    'file':         `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>`,
    'move':         `<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>`,
    'eye':          `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
    'maximize-2':   `<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>`,
};

/**
 * Build a complete SVG element string for the given icon name.
 * @param {string} name - Icon name (e.g. 'arrow-left')
 * @param {string} [extraClass=''] - Additional CSS classes to add to the SVG
 * @param {Object} [attrs={}] - Extra attributes (e.g. { style: 'color:red' })
 * @returns {string} Complete SVG HTML string
 */
export function svg(name, extraClass = '', attrs = {}) {
    const paths = ICONS[name] || ICONS['file'];
    const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    const classes = ['lucide-icon', extraClass].filter(Boolean).join(' ');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}" aria-hidden="true" ${attrStr}>${paths}</svg>`;
}

/**
 * Replace every <i data-lucide="name" class="..."> element in the current
 * document with an equivalent inline SVG. Call this once after DOMContentLoaded.
 */
export function applyPageIcons() {
    document.querySelectorAll('i[data-lucide]').forEach(el => {
        const name = el.getAttribute('data-lucide');
        const extraClass = el.className || '';
        const styleAttr = el.getAttribute('style') || '';
        const ariaAttr = el.getAttribute('aria-hidden') === 'true' ? { 'aria-hidden': 'true' } : {};
        const extraAttrs = styleAttr ? { ...ariaAttr, style: styleAttr } : ariaAttr;

        const svgEl = svg(name, extraClass, extraAttrs);

        // Replace the <i> with the SVG string
        el.outerHTML = svgEl;
    });
}

/**
 * Export the icon map for programmatic use
 */
export { ICONS };
export default applyPageIcons;
