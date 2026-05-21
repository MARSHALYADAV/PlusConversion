/**
 * NAVBAR COMPONENT
 * ================
 * Injects a shared responsive navbar into any page.
 *
 * Usage:
 *   import { initNavbar } from '../components/navbar.js';
 *   initNavbar('merge-pdf');  // pass the active tool's id to highlight the link
 *
 * WHY INJECT VIA JS?
 * We're using plain HTML files — no templating engine. A JS component avoids
 * copy-pasting 30 lines of navbar HTML into every page and ensures all pages
 * stay in sync when the nav changes.
 */

const NAV_LINKS = [
    { id: 'merge-pdf',      href: '/pages/merge-pdf.html',      icon: 'merge',            label: 'Merge' },
    { id: 'split-pdf',      href: '/pages/split-pdf.html',      icon: 'scissors',         label: 'Split' },
    { id: 'compress-pdf',   href: '/pages/compress-pdf.html',   icon: 'minimize-2',       label: 'Compress' },
    { id: 'rotate-pdf',     href: '/pages/rotate-pdf.html',     icon: 'rotate-cw',        label: 'Rotate' },
    { id: 'watermark-pdf',  href: '/pages/watermark-pdf.html',  icon: 'stamp',            label: 'Watermark' },
    { id: 'page-number-pdf',href: '/pages/page-number-pdf.html',icon: 'binary',           label: 'Page Numbers' },
    { id: 'jpg-to-pdf',     href: '/pages/jpg-to-pdf.html',     icon: 'images',           label: 'JPG to PDF' },
    { id: 'pdf-to-jpg',     href: '/pages/pdf-to-jpg.html',     icon: 'file-image',        label: 'PDF to JPG' },
];

/**
 * Inject the navbar into the page and set up mobile menu toggle.
 * @param {string} [activeId] - Tool ID to mark as active (e.g. 'merge-pdf')
 */
export function initNavbar(activeId) {
    let currentActiveId = activeId;
    if (!currentActiveId || currentActiveId === 'navbar-container') {
        const path = window.location.pathname;
        const matchingLink = NAV_LINKS.find(link => path.includes(link.id) || path.endsWith(link.href.split('/').pop()));
        if (matchingLink) {
            currentActiveId = matchingLink.id;
        } else {
            currentActiveId = '';
        }
    }

    // Ensure the CSS scroll-shadow works correctly
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 4);
    }, { passive: true });

    // Build link HTML (only first 6 in main nav — rest in mobile menu)
    const desktopLinks = NAV_LINKS.slice(0, 6).map(link => `
        <li>
            <a href="${link.href}"
               class="${link.id === currentActiveId ? 'active' : ''}"
               ${link.id === currentActiveId ? 'aria-current="page"' : ''}>
                <i data-lucide="${link.icon}"></i>
                ${link.label}
            </a>
        </li>
    `).join('');

    const mobileLinks = NAV_LINKS.map(link => `
        <a href="${link.href}"
           class="${link.id === currentActiveId ? 'active' : ''}"
           ${link.id === currentActiveId ? 'aria-current="page"' : ''}>
            <i data-lucide="${link.icon}"></i>
            ${link.label}
        </a>
    `).join('');

    const navHTML = `
        <nav class="navbar" role="navigation" aria-label="Main navigation">
            <div class="container">
                <div class="navbar-inner">
                    <!-- Brand -->
                    <a href="/" class="navbar-brand" aria-label="PlusConversion home">
                        <div class="navbar-brand-icon" aria-hidden="true">
                            <i data-lucide="refresh-cw"></i>
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

        // Close when a link is clicked
        mobileMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                hamburger.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar') && !e.target.closest('.navbar-mobile')) {
                mobileMenu.classList.remove('open');
                hamburger.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Dynamic Lucide initialization for all data-lucide elements currently in the DOM
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

export default {
    init: (activeId) => initNavbar(activeId),
    initNavbar
};

