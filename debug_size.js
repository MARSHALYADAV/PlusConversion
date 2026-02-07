const http = require('http');
const sharp = require('sharp');

async function runDebug() {
    try {
        console.log('Generating large test image...');
        // Create a noisy image which is harder to compress
        const width = 1000;
        const height = 1000;
        const channels = 3;
        const noiseBuffer = Buffer.alloc(width * height * channels);
        for (let i = 0; i < noiseBuffer.length; i++) {
            noiseBuffer[i] = Math.floor(Math.random() * 256);
        }

        const inputImage = await sharp(noiseBuffer, {
            raw: { width, height, channels }
        })
            .jpeg({ quality: 100 }) // Start high quality
            .toBuffer();

        console.log(`Original image size: ${inputImage.length} bytes`);

        const targetSize = 50 * 1024; // 50 KB
        console.log(`Target size: ${targetSize} bytes`);

        const boundary = '--------------------------debugboundary';

        const bodyStart =
            `--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\njpg\r\n` +
            `--${boundary}\r\nContent-Disposition: form-data; name="targetSize"\r\n\r\n${targetSize}\r\n` +
            `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="debug_random.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`;

        const bodyEnd = `\r\n--${boundary}--`;

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/convert',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(bodyStart) + inputImage.length + Buffer.byteLength(bodyEnd)
            }
        };

        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                console.log(`Received ${buffer.length} bytes.`);

                if (buffer.length <= targetSize) {
                    console.log('DEBUG SUCCESS: Image is under target size.');
                } else {
                    console.log('DEBUG FAILED: Image is NOT under target size!');
                    console.log(`Overshoot: ${buffer.length - targetSize} bytes`);
                }
            });
        });

        req.write(bodyStart);
        req.write(inputImage);
        req.write(bodyEnd);
        req.end();

    } catch (err) {
        console.error('Debug script error:', err);
    }
}

runDebug();
