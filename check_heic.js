const sharp = require('sharp');
console.log('Sharp Version:', require('sharp/package.json').version);
console.log('Formats:', sharp.format);
if (sharp.format.heif && sharp.format.heif.input) {
    console.log('HEIC Input Supported: YES');
} else {
    console.log('HEIC Input Supported: NO');
}
