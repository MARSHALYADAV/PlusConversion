# PlusConversion Platform Architecture

This document describes the modular architecture of the **PlusConversion** utility platform, optimized for low infrastructure cost, anonymous usage, temporary file storage, and rapid MVP scalability.

---

## 1. Modular Directory Structure

The project has been refactored from a monolithic setup into cleanly separated layers:

```
PlusConversion/
├── backend/
│   ├── api/             # HTTP Route Handlers (pdfRoutes.js, imageRoutes.js)
│   ├── middleware/      # Rate limiters, validators, sanitizers, error handler
│   ├── models/          # MongoDB Schemas (FileLog.js)
│   ├── services/        # Business Logic Services (pdfService.js, imageService.js, storageService.js)
│   ├── workers/         # Background transient tasks (cleanupWorker.js)
│   └── server.js        # Main bootstrap file
├── frontend/
│   └── public/          # HTML pages, CSS, Client scripts (script.js)
├── shared/              # Unified config presets (config.js)
├── docker/              # Multi-stage optimized Docker deployment (Dockerfile)
└── docs/                # Architectural manuals and guides (ARCHITECTURE.md)
```

---

## 2. Request & Processing Lifecycle

To protect server threads from blockages, heavy processes follow a structured **Processing Lifecycle**:

```
[Anonymous Client]
        │   (Upload Form)
        ▼
[Rate Limiter Middleware] (blocks spam / flood requests)
        │
        ▼
[Upload Validator Middleware] (checks file sizes up to 50MB and extensions)
        │
        ▼
[Sanitizer Middleware] (verifies file binary magic numbers to block extension spoofing)
        │
        ▼
[Service Processors] (Sharp and pdf-lib execute CPU heavy actions)
        │
        ▼
[Storage Service] (Saves transient outputs to Cloudinary or local disk folder)
        │
        ▼
[FileLog Database Model] (Logs transient file details with a 15-minute expiration)
        │
        ▼
[Controller Handler] (Delivers downloadUrl in clean JSON payload back to the client)
```

---

## 3. Storage Abstraction & Dual Cleanups

To support both seamless offline-first local development and enterprise-grade cloud deployments, the **Storage Layer** is built with abstract fallbacks:

* **Cloudinary Storage**: If the environment variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`) are present, files are saved directly in Cloudinary. The client receives secure Cloudinary download links, keeping the web server free of output bandwidth limits.
* **Local Disk Storage**: If variables are not detected, files are saved in `/temp_uploads/`. Express exposes a secure traversal-protected streaming endpoint `/temp/:storageId` that reads and streams buffers seamlessly.

### Dual Purge Cleanup Worker
A background worker runs every 60 seconds within the Express thread:
1. **DB Log Purge**: Queries MongoDB for records where `expiresAt` is past the current time, deletes the files from Cloudinary/disk, and deletes the log records.
2. **Orphan File Purge**: Scans `/temp_uploads/` directly on disk and unlinks files that have a modified date older than 15 minutes. This guarantees the server **never bloats its local disk** even if a MongoDB connection string was never supplied.

---

## 4. Key Middleware Protections

* **General & Heavy Limiting**: Employs separate request ceilings (max 100 requests per 15 minutes for API/previews, max 15 requests per 15 minutes for CPU-intensive conversion/PDF tasks).
* **Binary Header Signatures**: Analyzes buffer magic numbers to confirm file types directly, blocking malformed or spoofed inputs.
* **Unified Error Mapping**: Catches and translates all internal faults into clean, consistent JSON payloads, hiding full stack traces in production to prevent source exposures.
