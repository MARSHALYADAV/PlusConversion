/**
 * PlusConversion — Inline SVG Icon Map
 * =====================================
 * Each icon is a complete, self-contained SVG string.
 *
 * WHY INLINE SVG (not data-lucide)?
 * Using <i data-lucide="name"> requires lucide.createIcons() to run AFTER
 * the elements exist in the DOM. With dynamic JS injection this creates a
 * race condition where createIcons() fires before cards are rendered, leaving
 * empty containers. Inline SVGs render immediately on innerHTML assignment,
 * with zero dependency on external scripts or timing.
 *
 * Icon style: Lucide-compatible — 24×24, stroke-based, stroke-width 2,
 * stroke-linecap round, stroke-linejoin round, fill none.
 */

const SVG_ATTRS = `xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

export const iconMap = {
    // ── Core PDF Tools ──────────────────────────────────────────────────────
    'merge-pdf': `<svg ${SVG_ATTRS}><path d="M8 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/><path d="M16 6h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4"/><path d="M12 2v20"/><path d="m9 9 3-3 3 3"/><path d="m9 15 3 3 3-3"/></svg>`,

    'split-pdf': `<svg ${SVG_ATTRS}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,

    'compress-pdf': `<svg ${SVG_ATTRS}><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,

    'organize-pdf': `<svg ${SVG_ATTRS}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,

    'rearrange-pdf': `<svg ${SVG_ATTRS}><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>`,

    'remove-pdf': `<svg ${SVG_ATTRS}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,

    'extract-pdf': `<svg ${SVG_ATTRS}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="12" y2="18"/><line x1="15" y1="15" x2="12" y2="18"/></svg>`,

    'rotate-pdf': `<svg ${SVG_ATTRS}><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>`,

    'watermark-pdf': `<svg ${SVG_ATTRS}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,

    'page-number-pdf': `<svg ${SVG_ATTRS}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="9.01" y2="15"/><line x1="12" y1="15" x2="15" y2="15"/><line x1="9" y1="18" x2="9.01" y2="18"/><line x1="12" y1="18" x2="15" y2="18"/></svg>`,

    'crop-pdf': `<svg ${SVG_ATTRS}><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>`,

    // ── Image Tools ──────────────────────────────────────────────────────────
    'pdf-to-jpg': `<svg ${SVG_ATTRS}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,

    'jpg-to-pdf': `<svg ${SVG_ATTRS}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><rect x="8" y="12" width="8" height="6" rx="1"/><circle cx="10" cy="14" r="0.8"/><polyline points="8 18 11 15 13 17 15 14.5 16 16"/></svg>`,

    'image-convert': `<svg ${SVG_ATTRS}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,

    'image-resize': `<svg ${SVG_ATTRS}><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>`,

    // ── Upcoming Tools ───────────────────────────────────────────────────────
    'protect-pdf': `<svg ${SVG_ATTRS}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,

    'unlock-pdf': `<svg ${SVG_ATTRS}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,

    'ocr-pdf': `<svg ${SVG_ATTRS}><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="14" y2="15"/></svg>`,

    'compare-pdf': `<svg ${SVG_ATTRS}><rect x="2" y="3" width="9" height="18" rx="1"/><rect x="13" y="3" width="9" height="18" rx="1"/></svg>`,

    'edit-pdf': `<svg ${SVG_ATTRS}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,

    'sign-pdf': `<svg ${SVG_ATTRS}><path d="M3 17l4-8 4 4 4-6 4 8"/></svg>`,

    'ai-summarizer': `<svg ${SVG_ATTRS}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,

    'translate-pdf': `<svg ${SVG_ATTRS}><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>`,

    // ── Default fallback ─────────────────────────────────────────────────────
    'file': `<svg ${SVG_ATTRS}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
};

/**
 * Get inline SVG for a given tool ID.
 * Falls back to a generic file icon with a console warning if unmapped.
 * @param {string} toolId
 * @returns {string} SVG markup string
 */
export function getIcon(toolId) {
    const svg = iconMap[toolId];
    if (!svg) {
        if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production') {
            console.warn(`[IconMap] No icon found for tool ID "${toolId}". Using fallback.`);
        }
        return iconMap['file'];
    }
    return svg;
}

export default iconMap;
