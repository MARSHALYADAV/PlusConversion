import React, { useMemo, useState } from "https://esm.sh/react@18";

const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp', 'image/heic', 'image/heif'];

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function getPreviewSrc(file) {
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
  if (isHeic) {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTA5MGI5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01ek0yIDE3bDEwIDUgMTAtNU0yIDEybDEwIDUgMTAtNSIvPjwvc3ZnPg==';
  }
  return URL.createObjectURL(file);
}

export default function ImageConverter() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(80);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [targetSize, setTargetSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState('KB');
  const [keepMetadata, setKeepMetadata] = useState(false);
  const [useTransparency, setUseTransparency] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);

  const fileList = useMemo(() => selectedFiles.map((file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file
  })), [selectedFiles]);

  const addFiles = (files) => {
    const incoming = Array.from(files).filter(file => validImageTypes.includes(file.type) || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif'));
    if (incoming.length === 0) {
      alert('Please upload valid image files.');
      return;
    }
    setSelectedFiles(prev => [...prev, ...incoming]);
  };

  const handleFileInput = (event) => {
    addFiles(event.target.files);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) return;
    setIsLoading(true);
    setStatusMessage('Preparing conversion...');
    setProgress(0);

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('images', file));
    formData.append('format', format);
    formData.append('quality', quality);
    if (width) formData.append('width', width);
    if (height) formData.append('height', height);
    formData.append('maintainAspect', maintainAspect);
    if (targetSize) {
      const sizeValue = parseFloat(targetSize);
      const multiplier = sizeUnit === 'MB' ? 1024 * 1024 : 1024;
      formData.append('targetSize', Math.floor(sizeValue * multiplier));
    }
    formData.append('keepMetadata', keepMetadata);
    formData.append('useTransparency', useTransparency);
    formData.append('backgroundColor', backgroundColor);

    try {
      const timer = setInterval(() => {
        setProgress(prev => Math.min(95, prev + 5));
      }, 250);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData
      });

      clearInterval(timer);
      setProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Conversion failed');
      }

      const blob = await response.blob();
      const filename = response.headers.get('content-disposition')?.match(/filename="?(.*)"?/)?.[1] || `converted.${format}`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStatusMessage('Conversion successful! Your download should begin shortly.');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  return (
    <div className="image-converter">
      <div
        className={`drop-zone ${isLoading ? 'disabled' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="dz-content">
          <i className="dz-icon" data-lucide="cloud-upload"></i>
          <h2>Drag & Drop your image here</h2>
          <p>or</p>
          <label htmlFor="file-input" className="btn btn-secondary">Browse Files</label>
          <input id="file-input" type="file" accept="image/png, image/jpeg, image/jpg, image/webp, image/tiff, image/bmp, image/heic" multiple hidden onChange={handleFileInput} />
          <p className="formats-hint">Supports JPG, PNG, WEBP, BMP, TIFF, HEIC</p>
        </div>
      </div>

      {fileList.length > 0 && (
        <div className="file-list">
          {fileList.map((item, index) => (
            <div className="file-item" key={item.id}>
              <img className="file-thumb" src={getPreviewSrc(item.file)} alt={item.file.name} />
              <div className="file-info">
                <span className="file-name">{item.file.name}</span>
                <span className="file-meta">{formatBytes(item.file.size)}</span>
              </div>
              <button className="remove-btn" onClick={() => removeFile(index)} type="button" aria-label="Remove file">×</button>
            </div>
          ))}
        </div>
      )}

      <div className="settings-grid">
        <div className="setting-group">
          <label htmlFor="format-select">Convert to:</label>
          <select id="format-select" value={format} onChange={(event) => setFormat(event.target.value)}>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="webp">WEBP</option>
            <option value="tiff">TIFF</option>
          </select>
        </div>

        <div className="setting-group">
          <label>Resize:</label>
          <div className="resize-options">
            <div className="input-wrapper">
              <label htmlFor="width-input">Width</label>
              <input id="width-input" type="number" placeholder="Original" value={width} onChange={(event) => setWidth(event.target.value)} />
            </div>
            <div className="input-wrapper">
              <label htmlFor="height-input">Height</label>
              <input id="height-input" type="number" placeholder="Original" value={height} onChange={(event) => setHeight(event.target.value)} />
            </div>
          </div>
          <div className="checkbox-wrapper">
            <input id="maintain-aspect" type="checkbox" checked={maintainAspect} onChange={() => setMaintainAspect(!maintainAspect)} />
            <label htmlFor="maintain-aspect">Maintain Aspect Ratio</label>
          </div>
        </div>

        <div className="setting-group">
          <label htmlFor="target-size-input">Max File Size (Optional)</label>
          <div className="resize-options">
            <div className="input-wrapper">
              <input id="target-size-input" type="number" placeholder="e.g. 50" value={targetSize} onChange={(event) => setTargetSize(event.target.value)} />
            </div>
            <div className="input-wrapper" style={{ flex: '0 0 90px' }}>
              <select value={sizeUnit} onChange={(event) => setSizeUnit(event.target.value)}>
                <option value="KB">KB</option>
                <option value="MB">MB</option>
              </select>
            </div>
          </div>
        </div>

        <div className="setting-group quality-group">
          <label htmlFor="quality-range">Quality: <span>{quality}%</span></label>
          <input id="quality-range" type="range" min="10" max="100" value={quality} onChange={(event) => setQuality(event.target.value)} />
        </div>

        <div className="setting-group quality-group">
          <details className="advanced-details">
            <summary>Advanced Options</summary>
            <div className="advanced-options-grid">
              <div className="checkbox-wrapper">
                <input id="keep-metadata" type="checkbox" checked={keepMetadata} onChange={() => setKeepMetadata(!keepMetadata)} />
                <label htmlFor="keep-metadata">Preserve Metadata (EXIF)</label>
              </div>
              <div className="checkbox-wrapper">
                <input id="use-transparency" type="checkbox" checked={useTransparency} onChange={() => setUseTransparency(!useTransparency)} />
                <label htmlFor="use-transparency">Fill Transparent Background</label>
              </div>
              {useTransparency && (
                <div className="input-wrapper" style={{ marginTop: '0.5rem' }}>
                  <label htmlFor="bg-color" style={{ fontSize: '0.9rem' }}>Color:</label>
                  <input id="bg-color" type="color" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} />
                </div>
              )}
            </div>
          </details>
        </div>
      </div>

      <div className="action-area">
        <button className="btn btn-primary btn-lg" onClick={handleConvert} disabled={isLoading} type="button">
          {isLoading ? 'Converting...' : 'Convert & Download'}
        </button>
        <div className={`progress-bar ${progress === 0 ? 'hidden' : ''}`}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        {statusMessage && <p className="status-msg">{statusMessage}</p>}
      </div>
    </div>
  );
}
