/**
 * PDF TO JPG PAGE SCRIPT
 * Coming Soon — this page is a placeholder.
 * The UI renders a "Coming Soon" state to set expectations while the
 * server-side PDF rasterization feature is being built.
 */
import { initNavbar } from '../components/navbar.js';
import Toast          from '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar('pdf-to-jpg');

    // Notify user if they try to interact
    document.getElementById('notify-btn')?.addEventListener('click', () => {
        Toast.show('We\'ll notify you when PDF to JPG launches!', 'info');
    });
});
