(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // frontend/public/js/index.jsx
  var import_react_187 = __toESM(__require("https://esm.sh/react@18"));
  var import_client = __toESM(__require("https://esm.sh/react-dom@18/client"));

  // frontend/public/js/components/App.jsx
  var import_react_186 = __toESM(__require("https://esm.sh/react@18"));

  // frontend/public/js/components/Header.jsx
  var import_react_18 = __toESM(__require("https://esm.sh/react@18"));
  function Header() {
    return /* @__PURE__ */ import_react_18.default.createElement("header", { className: "header" }, /* @__PURE__ */ import_react_18.default.createElement("div", { className: "container header-inner" }, /* @__PURE__ */ import_react_18.default.createElement("h1", { className: "logo" }, /* @__PURE__ */ import_react_18.default.createElement("i", { className: "fa-solid fa-arrows-rotate" }), " PlusConversion"), /* @__PURE__ */ import_react_18.default.createElement("p", { className: "tagline" }, "Simple. Fast. Free File Conversion.")));
  }

  // frontend/public/js/components/Footer.jsx
  var import_react_182 = __toESM(__require("https://esm.sh/react@18"));
  function Footer() {
    return /* @__PURE__ */ import_react_182.default.createElement("footer", { className: "footer" }, /* @__PURE__ */ import_react_182.default.createElement("div", { className: "container footer-inner" }, /* @__PURE__ */ import_react_182.default.createElement("p", null, "\xA9 2026 PlusConversion. All rights reserved."), /* @__PURE__ */ import_react_182.default.createElement("p", { className: "footer-note" }, "Files are processed securely and deleted immediately."), /* @__PURE__ */ import_react_182.default.createElement("p", { className: "footer-note" }, "MADE WITH \u2764\uFE0F BY MARSHAL.")));
  }

  // frontend/public/js/components/ToolGrid.jsx
  var import_react_184 = __toESM(__require("https://esm.sh/react@18"));

  // frontend/public/js/components/ToolCard.jsx
  var import_react_183 = __toESM(__require("https://esm.sh/react@18"));
  function ToolCard({ tool }) {
    return /* @__PURE__ */ import_react_183.default.createElement("article", { className: "tool-card" }, /* @__PURE__ */ import_react_183.default.createElement("div", { className: "tool-card-icon" }, /* @__PURE__ */ import_react_183.default.createElement("i", { className: tool.icon })), /* @__PURE__ */ import_react_183.default.createElement("div", { className: "tool-card-body" }, /* @__PURE__ */ import_react_183.default.createElement("h4", null, tool.title), /* @__PURE__ */ import_react_183.default.createElement("p", null, tool.description)), /* @__PURE__ */ import_react_183.default.createElement("div", { className: "tool-card-action" }, /* @__PURE__ */ import_react_183.default.createElement("a", { href: tool.route, className: "btn btn-secondary btn-sm" }, "Open")));
  }

  // frontend/public/js/components/ToolGrid.jsx
  function ToolGrid({ tools }) {
    return /* @__PURE__ */ import_react_184.default.createElement("div", { className: "tool-grid" }, tools.map((tool) => /* @__PURE__ */ import_react_184.default.createElement(ToolCard, { key: tool.id, tool })));
  }

  // frontend/public/js/components/ImageConverter.jsx
  var import_react_185 = __toESM(__require("https://esm.sh/react@18"));
  var validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/tiff", "image/bmp", "image/heic", "image/heif"];
  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }
  function getPreviewSrc(file) {
    const isHeic = file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
    if (isHeic) {
      return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTA5MGI5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01ek0yIDE3bDEwIDUgMTAtNU0yIDEybDEwIDUgMTAtNSIvPjwvc3ZnPg==";
    }
    return URL.createObjectURL(file);
  }
  function ImageConverter() {
    const [selectedFiles, setSelectedFiles] = (0, import_react_185.useState)([]);
    const [format, setFormat] = (0, import_react_185.useState)("png");
    const [quality, setQuality] = (0, import_react_185.useState)(80);
    const [width, setWidth] = (0, import_react_185.useState)("");
    const [height, setHeight] = (0, import_react_185.useState)("");
    const [maintainAspect, setMaintainAspect] = (0, import_react_185.useState)(true);
    const [targetSize, setTargetSize] = (0, import_react_185.useState)("");
    const [sizeUnit, setSizeUnit] = (0, import_react_185.useState)("KB");
    const [keepMetadata, setKeepMetadata] = (0, import_react_185.useState)(false);
    const [useTransparency, setUseTransparency] = (0, import_react_185.useState)(false);
    const [backgroundColor, setBackgroundColor] = (0, import_react_185.useState)("#ffffff");
    const [isLoading, setIsLoading] = (0, import_react_185.useState)(false);
    const [statusMessage, setStatusMessage] = (0, import_react_185.useState)("");
    const [progress, setProgress] = (0, import_react_185.useState)(0);
    const fileList = (0, import_react_185.useMemo)(() => selectedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file
    })), [selectedFiles]);
    const addFiles = (files) => {
      const incoming = Array.from(files).filter((file) => validImageTypes.includes(file.type) || file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif"));
      if (incoming.length === 0) {
        alert("Please upload valid image files.");
        return;
      }
      setSelectedFiles((prev) => [...prev, ...incoming]);
    };
    const handleFileInput = (event) => {
      addFiles(event.target.files);
    };
    const removeFile = (index) => {
      setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
    };
    const handleDrop = (event) => {
      event.preventDefault();
      addFiles(event.dataTransfer.files);
    };
    const handleConvert = async () => {
      if (selectedFiles.length === 0) return;
      setIsLoading(true);
      setStatusMessage("Preparing conversion...");
      setProgress(0);
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("images", file));
      formData.append("format", format);
      formData.append("quality", quality);
      if (width) formData.append("width", width);
      if (height) formData.append("height", height);
      formData.append("maintainAspect", maintainAspect);
      if (targetSize) {
        const sizeValue = parseFloat(targetSize);
        const multiplier = sizeUnit === "MB" ? 1024 * 1024 : 1024;
        formData.append("targetSize", Math.floor(sizeValue * multiplier));
      }
      formData.append("keepMetadata", keepMetadata);
      formData.append("useTransparency", useTransparency);
      formData.append("backgroundColor", backgroundColor);
      try {
        const timer = setInterval(() => {
          setProgress((prev) => Math.min(95, prev + 5));
        }, 250);
        const response = await fetch("/api/convert", {
          method: "POST",
          body: formData
        });
        clearInterval(timer);
        setProgress(100);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Conversion failed");
        }
        const blob = await response.blob();
        const filename = response.headers.get("content-disposition")?.match(/filename="?(.*)"?/)?.[1] || `converted.${format}`;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setStatusMessage("Conversion successful! Your download should begin shortly.");
        setTimeout(() => setStatusMessage(""), 4e3);
      } catch (error) {
        setStatusMessage(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
        setTimeout(() => setProgress(0), 500);
      }
    };
    return /* @__PURE__ */ import_react_185.default.createElement("div", { className: "image-converter" }, /* @__PURE__ */ import_react_185.default.createElement(
      "div",
      {
        className: `drop-zone ${isLoading ? "disabled" : ""}`,
        onDragOver: (event) => event.preventDefault(),
        onDrop: handleDrop
      },
      /* @__PURE__ */ import_react_185.default.createElement("div", { className: "dz-content" }, /* @__PURE__ */ import_react_185.default.createElement("i", { className: "fa-solid fa-cloud-arrow-up dz-icon" }), /* @__PURE__ */ import_react_185.default.createElement("h2", null, "Drag & Drop your image here"), /* @__PURE__ */ import_react_185.default.createElement("p", null, "or"), /* @__PURE__ */ import_react_185.default.createElement("label", { htmlFor: "file-input", className: "btn btn-secondary" }, "Browse Files"), /* @__PURE__ */ import_react_185.default.createElement("input", { id: "file-input", type: "file", accept: "image/png, image/jpeg, image/jpg, image/webp, image/tiff, image/bmp, image/heic", multiple: true, hidden: true, onChange: handleFileInput }), /* @__PURE__ */ import_react_185.default.createElement("p", { className: "formats-hint" }, "Supports JPG, PNG, WEBP, BMP, TIFF, HEIC"))
    ), fileList.length > 0 && /* @__PURE__ */ import_react_185.default.createElement("div", { className: "file-list" }, fileList.map((item, index) => /* @__PURE__ */ import_react_185.default.createElement("div", { className: "file-item", key: item.id }, /* @__PURE__ */ import_react_185.default.createElement("img", { className: "file-thumb", src: getPreviewSrc(item.file), alt: item.file.name }), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "file-info" }, /* @__PURE__ */ import_react_185.default.createElement("span", { className: "file-name" }, item.file.name), /* @__PURE__ */ import_react_185.default.createElement("span", { className: "file-meta" }, formatBytes(item.file.size))), /* @__PURE__ */ import_react_185.default.createElement("button", { className: "remove-btn", onClick: () => removeFile(index), type: "button", "aria-label": "Remove file" }, "\xD7")))), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "settings-grid" }, /* @__PURE__ */ import_react_185.default.createElement("div", { className: "setting-group" }, /* @__PURE__ */ import_react_185.default.createElement("label", { htmlFor: "format-select" }, "Convert to:"), /* @__PURE__ */ import_react_185.default.createElement("select", { id: "format-select", value: format, onChange: (event) => setFormat(event.target.value) }, /* @__PURE__ */ import_react_185.default.createElement("option", { value: "png" }, "PNG"), /* @__PURE__ */ import_react_185.default.createElement("option", { value: "jpg" }, "JPG"), /* @__PURE__ */ import_react_185.default.createElement("option", { value: "webp" }, "WEBP"), /* @__PURE__ */ import_react_185.default.createElement("option", { value: "tiff" }, "TIFF"))), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "setting-group" }, /* @__PURE__ */ import_react_185.default.createElement("label", null, "Resize:"), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "resize-options" }, /* @__PURE__ */ import_react_185.default.createElement("div", { className: "input-wrapper" }, /* @__PURE__ */ import_react_185.default.createElement("label", { htmlFor: "width-input" }, "Width"), /* @__PURE__ */ import_react_185.default.createElement("input", { id: "width-input", type: "number", placeholder: "Original", value: width, onChange: (event) => setWidth(event.target.value) })), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "input-wrapper" }, /* @__PURE__ */ import_react_185.default.createElement("label", { htmlFor: "height-input" }, "Height"), /* @__PURE__ */ import_react_185.default.createElement("input", { id: "height-input", type: "number", placeholder: "Original", value: height, onChange: (event) => setHeight(event.target.value) }))), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "checkbox-wrapper" }, /* @__PURE__ */ import_react_185.default.createElement("input", { id: "maintain-aspect", type: "checkbox", checked: maintainAspect, onChange: () => setMaintainAspect(!maintainAspect) }), /* @__PURE__ */ import_react_185.default.createElement("label", { htmlFor: "maintain-aspect" }, "Maintain Aspect Ratio"))), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "setting-group" }, /* @__PURE__ */ import_react_185.default.createElement("label", { htmlFor: "target-size-input" }, "Max File Size (Optional)"), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "resize-options" }, /* @__PURE__ */ import_react_185.default.createElement("div", { className: "input-wrapper" }, /* @__PURE__ */ import_react_185.default.createElement("input", { id: "target-size-input", type: "number", placeholder: "e.g. 50", value: targetSize, onChange: (event) => setTargetSize(event.target.value) })), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "input-wrapper", style: { flex: "0 0 90px" } }, /* @__PURE__ */ import_react_185.default.createElement("select", { value: sizeUnit, onChange: (event) => setSizeUnit(event.target.value) }, /* @__PURE__ */ import_react_185.default.createElement("option", { value: "KB" }, "KB"), /* @__PURE__ */ import_react_185.default.createElement("option", { value: "MB" }, "MB"))))), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "setting-group quality-group" }, /* @__PURE__ */ import_react_185.default.createElement("label", { htmlFor: "quality-range" }, "Quality: ", /* @__PURE__ */ import_react_185.default.createElement("span", null, quality, "%")), /* @__PURE__ */ import_react_185.default.createElement("input", { id: "quality-range", type: "range", min: "10", max: "100", value: quality, onChange: (event) => setQuality(event.target.value) })), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "setting-group quality-group" }, /* @__PURE__ */ import_react_185.default.createElement("details", { className: "advanced-details" }, /* @__PURE__ */ import_react_185.default.createElement("summary", null, "Advanced Options"), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "advanced-options-grid" }, /* @__PURE__ */ import_react_185.default.createElement("div", { className: "checkbox-wrapper" }, /* @__PURE__ */ import_react_185.default.createElement("input", { id: "keep-metadata", type: "checkbox", checked: keepMetadata, onChange: () => setKeepMetadata(!keepMetadata) }), /* @__PURE__ */ import_react_185.default.createElement("label", { htmlFor: "keep-metadata" }, "Preserve Metadata (EXIF)")), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "checkbox-wrapper" }, /* @__PURE__ */ import_react_185.default.createElement("input", { id: "use-transparency", type: "checkbox", checked: useTransparency, onChange: () => setUseTransparency(!useTransparency) }), /* @__PURE__ */ import_react_185.default.createElement("label", { htmlFor: "use-transparency" }, "Fill Transparent Background")), useTransparency && /* @__PURE__ */ import_react_185.default.createElement("div", { className: "input-wrapper", style: { marginTop: "0.5rem" } }, /* @__PURE__ */ import_react_185.default.createElement("label", { htmlFor: "bg-color", style: { fontSize: "0.9rem" } }, "Color:"), /* @__PURE__ */ import_react_185.default.createElement("input", { id: "bg-color", type: "color", value: backgroundColor, onChange: (event) => setBackgroundColor(event.target.value) })))))), /* @__PURE__ */ import_react_185.default.createElement("div", { className: "action-area" }, /* @__PURE__ */ import_react_185.default.createElement("button", { className: "btn btn-primary btn-lg", onClick: handleConvert, disabled: isLoading, type: "button" }, isLoading ? "Converting..." : "Convert & Download"), /* @__PURE__ */ import_react_185.default.createElement("div", { className: `progress-bar ${progress === 0 ? "hidden" : ""}` }, /* @__PURE__ */ import_react_185.default.createElement("div", { className: "progress-fill", style: { width: `${progress}%` } })), statusMessage && /* @__PURE__ */ import_react_185.default.createElement("p", { className: "status-msg" }, statusMessage)));
  }

  // frontend/public/js/data/pdfTools.js
  var pdfTools = [
    {
      id: "merge",
      title: "Merge PDF",
      description: "Combine multiple PDF files into one document.",
      icon: "fa-solid fa-file-arrow-down",
      route: "#"
    },
    {
      id: "split",
      title: "Split PDF",
      description: "Split a PDF into individual pages or sections.",
      icon: "fa-solid fa-file-lines",
      route: "#"
    },
    {
      id: "compress",
      title: "Compress PDF",
      description: "Reduce PDF file size while keeping readability.",
      icon: "fa-solid fa-compress",
      route: "#"
    },
    {
      id: "convert-to-pdf",
      title: "Convert to PDF",
      description: "Turn images or documents into PDF format.",
      icon: "fa-solid fa-file-export",
      route: "#"
    },
    {
      id: "unlock",
      title: "Unlock PDF",
      description: "Remove password protection from PDFs securely.",
      icon: "fa-solid fa-lock-open",
      route: "#"
    },
    {
      id: "protect",
      title: "Protect PDF",
      description: "Add a password to keep your PDF files safe.",
      icon: "fa-solid fa-lock",
      route: "#"
    }
  ];
  var pdfTools_default = pdfTools;

  // frontend/public/js/components/App.jsx
  function App() {
    return /* @__PURE__ */ import_react_186.default.createElement("div", { className: "app-shell" }, /* @__PURE__ */ import_react_186.default.createElement(Header, null), /* @__PURE__ */ import_react_186.default.createElement("main", { className: "main-content" }, /* @__PURE__ */ import_react_186.default.createElement("div", { className: "container" }, /* @__PURE__ */ import_react_186.default.createElement("section", { className: "hero-card card" }, /* @__PURE__ */ import_react_186.default.createElement("div", { className: "hero-copy" }, /* @__PURE__ */ import_react_186.default.createElement("h2", { className: "section-title" }, "Fast PDF tools & image conversion"), /* @__PURE__ */ import_react_186.default.createElement("p", { className: "section-subtitle" }, "Manage your files like a pro: merge, split, compress, and convert images with a modern, responsive interface."))), /* @__PURE__ */ import_react_186.default.createElement("section", { className: "card tool-section" }, /* @__PURE__ */ import_react_186.default.createElement("div", { className: "section-heading" }, /* @__PURE__ */ import_react_186.default.createElement("h3", null, "Popular PDF Tools"), /* @__PURE__ */ import_react_186.default.createElement("p", null, "Quick access to the most common PDF actions\u2014modeled after premium converters.")), /* @__PURE__ */ import_react_186.default.createElement(ToolGrid, { tools: pdfTools_default })), /* @__PURE__ */ import_react_186.default.createElement("section", { className: "card converter-section" }, /* @__PURE__ */ import_react_186.default.createElement("div", { className: "section-heading" }, /* @__PURE__ */ import_react_186.default.createElement("h3", null, "Image Conversion"), /* @__PURE__ */ import_react_186.default.createElement("p", null, "Upload images, choose your options, and download converted files instantly.")), /* @__PURE__ */ import_react_186.default.createElement(ImageConverter, null)))), /* @__PURE__ */ import_react_186.default.createElement(Footer, null));
  }

  // frontend/public/js/index.jsx
  var rootElement = document.getElementById("root");
  var root = import_client.default.createRoot(rootElement);
  root.render(/* @__PURE__ */ import_react_187.default.createElement(App, null));
})();
