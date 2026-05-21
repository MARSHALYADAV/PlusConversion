/**
 * NAVBAR COMPONENT
 * ================
 * Injects a shared responsive navbar into any page.
 *
 * Usage:
 *   import { initNavbar } from '../components/navbar.js';
 *   initNavbar('merge-pdf');  // pass the active tool's id to highlight the link
 *
 * WHY INLINE SVG (not data-lucide)?
 * Using <i data-lucide="name"> requires window.lucide.createIcons() to fire
 * AFTER the elements are in the DOM. Because this navbar is injected via JS,
 * the timing of that CDN script vs. module execution is unpredictable and
 * causes blank icons on production deployments. Inline SVG renders immediately.
 */

// ─── Inline SVG Icon Strings ─────────────────────────────────────────────────
const S = `xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

const NAV_ICONS = {
    // Brand logo
    'brand': `<svg ${S}><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>`,
    // Nav links
    'merge':      `<svg ${S}><path d="M8 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/><path d="M16 6h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4"/><path d="M12 2v20"/><path d="m9 9 3-3 3 3"/><path d="m9 15 3 3 3-3"/></svg>`,
    'scissors':   `<svg ${S}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`,
    'minimize-2': `<svg ${S}><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    'rotate-cw':  `<svg ${S}><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>`,
    'stamp':      `<svg ${S}><path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17 13h-1a2.5 2.5 0 0 1-2.5-2.5v-3a2.5 2.5 0 0 0-5 0v3A2.5 2.5 0 0 1 6 13H5a2.5 2.5 0 0 0-1.77 4.26L5 19h14l1.77-1.74A2.5 2.5 0 0 0 19.27 13.73z"/></svg>`,
    'binary':     `<svg ${S}><rect x="14" y="14" width="4" height="6" rx="2"/><rect x="6" y="4" width="4" height="6" rx="2"/><path d="M6 20h4"/><path d="M14 10h4"/><path d="M6 14h2v6"/><path d="M14 4h2v6"/></svg>`,
    'images':     `<svg ${S}><rect x="18" y="3" width="4" height="14" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1" transform="rotate(10 10 7)"/><rect x="2" y="11" width="4" height="14" rx="1" transform="rotate(-10 2 11)"/></svg>`,
    'file-image': `<svg ${S}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"/></svg>`,
};

function icon(name) {
    return NAV_ICONS[name] || NAV_ICONS['brand'];
}

// ─── Nav Link Data ────────────────────────────────────────────────────────────
const NAV_LINKS = [
    { id: 'merge-pdf',       href: '/pages/merge-pdf.html',       icon: 'merge',      label: 'Merge' },
    { id: 'split-pdf',       href: '/pages/split-pdf.html',       icon: 'scissors',   label: 'Split' },
    { id: 'compress-pdf',    href: '/pages/compress-pdf.html',    icon: 'minimize-2', label: 'Compress' },
    { id: 'rotate-pdf',      href: '/pages/rotate-pdf.html',      icon: 'rotate-cw',  label: 'Rotate' },
    { id: 'watermark-pdf',   href: '/pages/watermark-pdf.html',   icon: 'stamp',      label: 'Watermark' },
    { id: 'page-number-pdf', href: '/pages/page-number-pdf.html', icon: 'binary',     label: 'Page Numbers' },
    { id: 'jpg-to-pdf',      href: '/pages/jpg-to-pdf.html',      icon: 'images',     label: 'JPG to PDF' },
    { id: 'pdf-to-jpg',      href: '/pages/pdf-to-jpg.html',      icon: 'file-image', label: 'PDF to JPG' },
];

// ─── Init ─────────────────────────────────────────────────────────────────────
/**
 * Inject the navbar into the page and set up mobile menu toggle.
 * @param {string} [activeId] - Tool ID to mark as active (e.g. 'merge-pdf')
 */
export function initNavbar(activeId) {
    let currentActiveId = activeId;
    if (!currentActiveId || currentActiveId === 'navbar-container') {
        const path = window.location.pathname;
        const matchingLink = NAV_LINKS.find(link =>
            path.includes(link.id) || path.endsWith(link.href.split('/').pop())
        );
        currentActiveId = matchingLink ? matchingLink.id : '';
    }

    // CSS scroll-shadow
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 4);
    }, { passive: true });

    // Build link HTML — inline SVGs, no data-lucide
    const desktopLinks = NAV_LINKS.slice(0, 6).map(link => `
        <li>
            <a href="${link.href}"
               class="${link.id === currentActiveId ? 'active' : ''}"
               ${link.id === currentActiveId ? 'aria-current="page"' : ''}>
                ${icon(link.icon)}
                ${link.label}
            </a>
        </li>
    `).join('');

    const mobileLinks = NAV_LINKS.map(link => `
        <a href="${link.href}"
           class="${link.id === currentActiveId ? 'active' : ''}"
           ${link.id === currentActiveId ? 'aria-current="page"' : ''}>
            ${icon(link.icon)}
            ${link.label}
        </a>
    `).join('');

    const navHTML = `
        <nav class="navbar" role="navigation" aria-label="Main navigation">
            <div class="container">
                <div class="navbar-inner">
                    <!-- Brand — inline SVG logo, no data-lucide -->
                    <a href="/" class="navbar-brand" aria-label="PlusConversion home">
                        <div class="navbar-brand-icon" aria-hidden="true">
                            ${icon('brand')}
                        </div>
                        Plus<span>Conversion</span>
                    </a>

                    <!-- Desktop links -->
                    <ul class="navbar-links" role="list">
                        ${desktopLinks}
                    </ul>

                    <!-- Right side -->
                    <div class="navbar-cta" style="display:flex;align-items:center;gap:0.75rem;">
                        <a href="/" class="btn btn-secondary btn-sm">All Tools</a>
                        <!-- Hamburger for mobile -->
                        <button class="navbar-hamburger" id="nav-hamburger"
                                aria-label="Toggle menu" aria-expanded="false" aria-controls="nav-mobile-menu">
                            <span class="hamburger-line"></span>
                            <span class="hamburger-line"></span>
                            <span class="hamburger-line"></span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Mobile slide-down menu -->
        <div class="navbar-mobile" id="nav-mobile-menu" role="menu" aria-label="Mobile navigation">
            <div class="container">
                ${mobileLinks}
            </div>
        </div>
    `;

    // Insert into container if exists, otherwise prepend to body
    const container = document.getElementById('navbar-container');
    if (container) {
        container.innerHTML = navHTML;
    } else {
        document.body.insertAdjacentHTML('afterbegin', navHTML);
    }

    // Wire hamburger toggle
    const hamburger = document.getElementById('nav-hamburger');
    const mobileMenu = document.getElementById('nav-mobile-menu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('open');
            hamburger.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
        });

        mobileMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                hamburger.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar') && !e.target.closest('.navbar-mobile')) {
                mobileMenu.classList.remove('open');
                hamburger.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

export default {
    init: (activeId) => initNavbar(activeId),
    initNavbar
};
