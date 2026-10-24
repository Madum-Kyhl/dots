const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DATA_FILE = path.join(process.cwd(), 'data/tasks.csv');
const PUBLIC_DIR = path.join(process.cwd(), 'frontend');

http.createServer((req, res) => {
    // Handle POST request to save tasks back to CSV on disk
    if (req.method === 'POST' && req.url === '/save') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { csv } = JSON.parse(body);
                fs.writeFileSync(DATA_FILE, csv, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success' }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

// Serve tasks.csv directly if requested
    if (req.url === '/tasks.csv') {
        fs.readFile(DATA_FILE, (err, content) => {
            if (err) { res.writeHead(404); res.end('Not found'); }
            else { res.writeHead(200, { 'Content-Type': 'text/csv' }); res.end(content); }
        });
        return;
    }

    // Serve static frontend files with correct MIME types
    let filePath = path.join(PUBLIC_DIR, req.url === '/' || req.url.startsWith('/?') ? 'index.html' : req.url.split('?')[0]);
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'application/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}).listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});