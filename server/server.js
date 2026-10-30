const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./database');
const handleCrumbsApi = require('../extensions/crumbs/backend');
const handleDotsApi = require('../extensions/dots/backend');

const PORT = 8080;
const PUBLIC_DIR = path.join(process.cwd(), 'client');

http.createServer((req, res) => {
    // Log all incoming requests to Docker console
    console.log(`[HTTP] ${req.method} ${req.url}`);
    
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Delegate API requests to extensions
    if (handleCrumbsApi(req, res, parsedUrl, pathname)) {
        return;
    }
    if (handleDotsApi(req, res, parsedUrl, pathname)) {
        return;
    }

    // Serve static files: Handle /extensions/ from root, everything else from client/
    let filePath;
    if (pathname.startsWith('/extensions/')) {
        filePath = path.join(process.cwd(), pathname);
    } else {
        filePath = path.join(PUBLIC_DIR, pathname === '/' || pathname.startsWith('/?') ? 'index.html' : pathname);
    }
    
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