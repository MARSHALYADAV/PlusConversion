const pdfTools = [
  {
    id: 'merge',
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into one document.',
    icon: 'fa-solid fa-file-arrow-down',
    route: '#'
  },
  {
    id: 'split',
    title: 'Split PDF',
    description: 'Split a PDF into individual pages or sections.',
    icon: 'fa-solid fa-file-lines',
    route: '#'
  },
  {
    id: 'compress',
    title: 'Compress PDF',
    description: 'Reduce PDF file size while keeping readability.',
    icon: 'fa-solid fa-compress',
    route: '#'
  },
  {
    id: 'convert-to-pdf',
    title: 'Convert to PDF',
    description: 'Turn images or documents into PDF format.',
    icon: 'fa-solid fa-file-export',
    route: '#'
  },
  {
    id: 'unlock',
    title: 'Unlock PDF',
    description: 'Remove password protection from PDFs securely.',
    icon: 'fa-solid fa-lock-open',
    route: '#'
  },
  {
    id: 'protect',
    title: 'Protect PDF',
    description: 'Add a password to keep your PDF files safe.',
    icon: 'fa-solid fa-lock',
    route: '#'
  }
];

export default pdfTools;
