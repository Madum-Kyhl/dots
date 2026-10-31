const http = require('http');
const fs = require('fs');
const path = require('path');
const { loadExtensions } = require('./extensionsManager');

const PORT = 8080;
const PUBLIC_DIR = path.join(process.cwd(), 'client');
const EXTENSIONS_DIR = path.join(process.cwd(), 'extensions');

// Load extension manifests and handlers via the separate manager module
const { extensionManifests, extensionHandlers } = loadExtensions(EXTENSIONS_DIR);

// HTTP Server Core Request Lifecycle
http.createServer((req, res) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Core Platform System APIs: Handle built-in infrastructure routes prior to delegating to extension handlers.
    if (pathname === '/api/extensions' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(extensionManifests));
        return;
    }

    // Extension Backend Delegation: Iterate through dynamically loaded extension handlers. If a handler matches
    // and processes the request, execution short-circuits and returns.
    for (const handler of extensionHandlers) {
        if (handler(req, res, parsedUrl, pathname)) return;
    }

    // Static File Serving Fallback: Resolve and serve static web assets from either the /extensions root or the 
    // client public directory.
    let filePath;
    if (pathname.startsWith('/extensions/')) {
        filePath = path.join(process.cwd(), pathname);
    } else if (pathname === '/' || pathname.startsWith('/?')) {
        filePath = path.join(PUBLIC_DIR, 'index.html');
    } else {
        filePath = path.join(PUBLIC_DIR, pathname);
    }
    
    const extname = path.extname(filePath);
    const contentTypes = {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg'
    };

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentTypes[extname] || 'text/html' });
            res.end(content);
        }
    });
}).listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});