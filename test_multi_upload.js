const http = require('http');
const sharp = require('sharp');
const fs = require('fs');

async function runMultiTest() {
    try {
        console.log('Generating test images...');
        const images = [];
        for (let i = 0; i < 3; i++) {
            const buffer = await sharp({
                create: {
                    width: 100,
                    height: 100,
                    channels: 3,
                    background: { r: i * 50, g: 0, b: 0 }
                }
            })
                .png()
                .toBuffer();
            images.push({ buffer, name: `test_img_${i}.png` });
        }

        const boundary = '--------------------------multitestboundary';
        const hostname = 'localhost';
        const port = 3000;
        const path = '/api/convert';

        let body = '';

        // Add fields
        body += `--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\njpg\r\n`;
        body += `--${boundary}\r\nContent-Disposition: form-data; name="quality"\r\n\r\n80\r\n`;

        // Add images
        images.forEach(img => {
            body += `--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="${img.name}"\r\nContent-Type: image/png\r\n\r\n`;
            // We can't easily concatenate buffers with strings in JS without using Buffer.concat for the whole body.
            // So we'll build an array of chunks.
        });

        // Let's build the body as a Buffer because images are binary
        const chunks = [];

        chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\njpg\r\n`));

        images.forEach(img => {
            chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="${img.name}"\r\nContent-Type: image/png\r\n\r\n`));
            chunks.push(img.buffer);
            chunks.push(Buffer.from(`\r\n`));
        });

        chunks.push(Buffer.from(`--${boundary}--\r\n`));

        const bodyBuffer = Buffer.concat(chunks);

        const options = {
            hostname,
            port,
            path,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': bodyBuffer.length
            }
        };

        console.log('Sending request...');
        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

            const responseChunks = [];
            res.on('data', (chunk) => responseChunks.push(chunk));
            res.on('end', () => {
                const responseBuffer = Buffer.concat(responseChunks);
                console.log(`Received ${responseBuffer.length} bytes.`);

                if (res.headers['content-type'] === 'application/zip') {
                    console.log('SUCCESS: Received ZIP file.');
                } else {
                    console.log('FAILED: Did not receive ZIP file.');
                    console.log('Body start:', responseBuffer.slice(0, 100).toString());
                }
            });
        });

        req.write(bodyBuffer);
        req.end();

    } catch (err) {
        console.error('Test error:', err);
    }
}

runMultiTest();
