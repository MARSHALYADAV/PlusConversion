const http = require('http');
const sharp = require('sharp');

async function runPreviewTest() {
    try {
        console.log('Generating test image...');
        const inputImage = await sharp({
            create: {
                width: 100,
                height: 100,
                channels: 3,
                background: { r: 0, g: 255, b: 0 }
            }
        })
            .png()
            .toBuffer();

        const boundary = '--------------------------previewtestboundary';

        const bodyStart =
            `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`;

        const bodyEnd = `\r\n--${boundary}--`;

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/preview',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(bodyStart) + inputImage.length + Buffer.byteLength(bodyEnd)
            }
        };

        console.log('Sending preview request...');
        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                console.log(`Received ${buffer.length} bytes.`);

                if (res.statusCode === 200 && res.headers['content-type'] === 'image/jpeg') {
                    console.log('SUCCESS: Preview generated (JPEG).');
                } else {
                    console.log('FAILED: Preview generation failed.');
                }
            });
        });

        req.write(bodyStart);
        req.write(inputImage);
        req.write(bodyEnd);
        req.end();

    } catch (err) {
        console.error('Test error:', err);
    }
}

runPreviewTest();
