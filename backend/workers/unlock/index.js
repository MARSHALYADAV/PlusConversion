const { PDFDocument } = require('pdf-lib');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
const logger = require('../../utils/logger');

/**
 * Check if a shell command is available
 */
async function checkCommand(cmd) {
    try {
        await execPromise(`which ${cmd}`);
        return true;
    } catch {
        return false;
    }
}

/**
 * Remove password protection from a PDF buffer.
 * @param {Buffer} pdfBuffer
 * @param {string} password
 * @returns {Promise<Buffer>} Unlocked PDF buffer
 */
async function unlockPdf(pdfBuffer, password = '') {
    logger.info('Starting PDF unlock worker');

    if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('No PDF buffer provided');
    }

    // --- PIPELINE 1: Try using qpdf if available (very robust for password decryption) ---
    try {
        const hasQpdf = await checkCommand('qpdf');
        if (hasQpdf) {
            logger.info('qpdf detected. Attempting decryption via qpdf...');
            return await decryptWithQpdf(pdfBuffer, password);
        }
    } catch (qpdfErr) {
        // If qpdf explicitly failed due to bad password, throw that immediately
        if (qpdfErr.message.includes('Password Incorrect') || qpdfErr.message.includes('invalid password')) {
            throw new Error('INVALID_PASSWORD');
        }
        logger.warn(`qpdf decryption failed, trying JS-native fallback: ${qpdfErr.message}`);
    }

    // --- PIPELINE 2: JS-Native pdf-lib decryption ---
    logger.info('Attempting JS-native decryption via pdf-lib...');
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer, {
            password: password,
            ignoreEncryption: false
        });

        const decryptedBytes = await pdfDoc.save();
        return Buffer.from(decryptedBytes);
    } catch (err) {
        const errMsg = err.message || '';
        logger.error(`pdf-lib load error during decrypt: ${errMsg}`);

        if (errMsg.includes('encrypted') || errMsg.includes('Password') || errMsg.includes('password')) {
            if (!password) {
                throw new Error('PASSWORD_REQUIRED');
            } else {
                throw new Error('INVALID_PASSWORD');
            }
        }
        throw err;
    }
}

/**
 * Decrypt PDF using qpdf command line tool
 */
async function decryptWithQpdf(pdfBuffer, password) {
    const tempDir = path.join(__dirname, '../../../temp_uploads');
    await fs.mkdir(tempDir, { recursive: true });

    const rand = Math.random().toString(36).slice(2);
    const inputPath = path.join(tempDir, `unlock_in_${Date.now()}_${rand}.pdf`);
    const outputPath = path.join(tempDir, `unlock_out_${Date.now()}_${rand}.pdf`);

    try {
        await fs.writeFile(inputPath, pdfBuffer);

        let cmd = `qpdf --decrypt --password="${password.replace(/"/g, '\\"')}" "${inputPath}" "${outputPath}"`;
        logger.info(`Executing qpdf command: qpdf --decrypt --password="***"`);
        
        await execPromise(cmd);

        const decryptedBuffer = await fs.readFile(outputPath);
        logger.info(`qpdf decryption successful: ${decryptedBuffer.length} bytes`);
        return decryptedBuffer;
    } catch (err) {
        const stdoutErr = err.stdout || '';
        const stderrErr = err.stderr || '';
        const combined = (stdoutErr + stderrErr).toLowerCase();

        if (combined.includes('password') || combined.includes('invalid') || combined.includes('incorrect') || err.code === 3) {
            throw new Error('INVALID_PASSWORD');
        }
        throw err;
    } finally {
        await safeUnlink(inputPath);
        await safeUnlink(outputPath);
    }
}

/**
 * Safely delete a file
 */
async function safeUnlink(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            logger.warn(`Failed to clean up temp file ${filePath}: ${err.message}`);
        }
    }
}

module.exports = unlockPdf;
