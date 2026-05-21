import { getIcon } from '../utils/iconMap.js';

/**
 * Renders a standard tool card HTML string.
 *
 * WHY INLINE SVG?
 * Using <i data-lucide="name"> requires lucide.createIcons() to run AFTER
 * the elements are in the DOM. With JS-injected grids this causes a timing
 * race where icons are never converted. Inline SVG renders immediately on
 * innerHTML assignment — zero dependency on external scripts or call order.
 *
 * @param {Object} t - Tool definition object { id, href, title, desc, badge? }
 * @returns {string} - Complete, semantic HTML card string
 */
export function renderToolCard(t) {
    const iconSvg = getIcon(t.id);

    return `
        <a href="${t.href}" class="tool-card" id="tool-${t.id}" aria-label="${t.title}">
            ${t.badge ? `<div class="tool-card-badge">${t.badge}</div>` : ''}
            <div class="tool-card-icon-container">
                ${iconSvg}
            </div>
            <div class="tool-card-content">
                <div class="tool-card-title">${t.title}</div>
                <div class="tool-card-desc">${t.desc}</div>
            </div>
            <div class="tool-card-link">
                Open tool
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="link-arrow"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
        </a>
    `;
}

export default renderToolCard;
