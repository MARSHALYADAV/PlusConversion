import { setupImageConverter } from '../pages/imageConverter.js';
import { setupPdfTools } from '../pages/pdfTools.js';

// PDF Tools Data
const pdfTools = [
  {
    id: 'merge',
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into one document.',
    icon: 'merge',
    route: 'merge'
  },
  {
    id: 'split',
    title: 'Split PDF',
    description: 'Split a PDF into individual pages or sections.',
    icon: 'scissors',
    route: 'split'
  },
  {
    id: 'compress',
    title: 'Compress PDF',
    description: 'Reduce PDF file size while keeping readability.',
    icon: 'minimize-2',
    route: 'compress'
  },
  {
    id: 'convert-to-pdf',
    title: 'Convert to PDF',
    description: 'Turn images or documents into PDF format.',
    icon: 'file-output',
    route: '#'
  },
  {
    id: 'unlock',
    title: 'Unlock PDF',
    description: 'Remove password protection from PDFs securely.',
    icon: 'unlock',
    route: '#'
  },
  {
    id: 'protect',
    title: 'Protect PDF',
    description: 'Add a password to keep your PDF files safe.',
    icon: 'lock',
    route: '#'
  }
];

// Render Tool Grid
function renderToolGrid() {
  const grid = document.getElementById('tool-grid');
  if (!grid) return;
  grid.innerHTML = pdfTools.map(tool => `
    <article class="tool-card" ${tool.route !== '#' ? `data-tool="${tool.route}"` : ''}>
      ${tool.route === '#' ? '<div class="badge-coming-soon">Coming Soon</div>' : ''}
      <div class="tool-card-icon">
        <i data-lucide="${tool.icon}"></i>
      </div>
      <div class="tool-card-body">
        <h4>${tool.title}</h4>
        <p>${tool.description}</p>
      </div>
      <div class="tool-card-action">
        <a href="${tool.route === '#' ? '#' : 'javascript:void(0)'}" class="btn btn-secondary btn-sm" ${tool.route !== '#' ? `onclick="showTool('${tool.route}')"` : 'onclick="alert(\'Coming soon!\')"'}>Open</a>
      </div>
    </article>
  `).join('');

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Navigation Functions
export function showTool(toolName) {
  document.getElementById('tools-grid-section').classList.add('hidden');
  document.getElementById('converter-section').classList.add('hidden');
  document.getElementById(`${toolName}-pdf-section`).classList.remove('hidden');
}

export function backToGrid() {
  document.querySelectorAll('.pdf-tool-section').forEach(el => el.classList.add('hidden'));
  document.getElementById('tools-grid-section').classList.remove('hidden');
  document.getElementById('converter-section').classList.remove('hidden');
}

// Bind to window to allow HTML onclick access
window.showTool = showTool;
window.backToGrid = backToGrid;

document.addEventListener('DOMContentLoaded', () => {
    renderToolGrid();
    setupImageConverter();
    setupPdfTools();
});
