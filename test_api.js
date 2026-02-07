const fs = require('fs');
const http = require('http');
const path = require('path');

// Create a simple 1x1 buffer pretending to be an image (mocking it for now or we can use sharp to create one)
// Actually better to use sharp to create a real valid image to test the pipeline fully
const sharp = require('sharp');

async function runTest() {
    try {
        console.log('Generating test image...');
        const inputImage = await sharp({
            create: {
                width: 100,
                height: 100,
                channels: 3,
                background: { r: 255, g: 0, b: 0 }
            }
        })
            .png()
            .toBuffer();

        console.log('Test image generated. Sending request...');

        const boundary = '--------------------------367944062141516067860155';
        const hostname = 'localhost';
        const port = 3000;
        const path = '/api/convert';

        const bodyStart =
            `--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\njpg\r\n` +
            `--${boundary}\r\nContent-Disposition: form-data; name="width"\r\n\r\n50\r\n` +
            `--${boundary}\r\nContent-Disposition: form-data; name="targetSize"\r\n\r\n1000\r\n` +
            `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`;

        const bodyEnd = `\r\n--${boundary}--`;

        const options = {
            hostname,
            port,
            path,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(bodyStart) + inputImage.length + Buffer.byteLength(bodyEnd)
            }
        };

        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

            const chunks = [];
            res.on('data', (chunk) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                console.log(`Received ${buffer.length} bytes.`);
                if (res.statusCode === 200 && buffer.length > 0) {
                    console.log('Test PASSED: Image received.');
                    // Verification of the image format could be done here if needed
                } else {
                    console.log('Test FAILED.');
                    console.log('Body:', buffer.toString());
                }
            });
        });

        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });

        req.write(bodyStart);
        req.write(inputImage);
        req.write(bodyEnd);
        req.end();

    } catch (err) {
        console.error('Test script error:', err);
    }
}

runTest();
