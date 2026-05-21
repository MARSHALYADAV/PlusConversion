import { iconMap } from '../utils/iconMap.js';

/**
 * Renders a standard tool card HTML string.
 * @param {Object} t - Tool definition object
 * @returns {string} - Clean, semantic HTML string
 */
export function renderToolCard(t) {
    const iconName = iconMap[t.id] || 'file';
    return `
        <a href="${t.href}" class="tool-card" id="tool-${t.id}" aria-label="${t.title}">
            ${t.badge ? `<div class="tool-card-badge">${t.badge}</div>` : ''}
            <div class="tool-card-icon-container">
                <i data-lucide="${iconName}" class="tool-icon"></i>
            </div>
            <div class="tool-card-content">
                <div class="tool-card-title">${t.title}</div>
                <div class="tool-card-desc">${t.desc}</div>
            </div>
            <div class="tool-card-link">
                Open tool <i data-lucide="arrow-right" class="link-arrow"></i>
            </div>
        </a>
    `;
}

export default renderToolCard;
