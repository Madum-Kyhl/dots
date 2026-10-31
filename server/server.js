const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PUBLIC_DIR = path.join(process.cwd(), 'client');
const EXTENSIONS_DIR = path.join(process.cwd(), 'extensions');

// Runtime extension registries
const extensionManifests = [];
const extensionHandlers = [];


// Startup Initialization: Scan the /extensions directory for plug-and-play modules,
// read their manifests, cache metadata, and load backend routers dynamically.
if (fs.existsSync(EXTENSIONS_DIR)) {
    const extFolders = fs.readdirSync(EXTENSIONS_DIR, { withFileTypes: true });
    
    extFolders.forEach(dirent => {
        if (dirent.isDirectory()) {
            const extName = dirent.name;
            const manifestPath = path.join(EXTENSIONS_DIR, extName, 'manifest.json');
            const backendPath = path.join(EXTENSIONS_DIR, extName, 'backend.js');

            if (fs.existsSync(manifestPath)) {
                try {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    extensionManifests.push(manifest);
                    console.log(`[Extension] Discovered: ${manifest.name} (v${manifest.version})`);

                    if (fs.existsSync(backendPath)) {
                        const registerBackend = require(backendPath);
                        if (typeof registerBackend === 'function') {
                            extensionHandlers.push(registerBackend);
                            console.log(`[Extension] Loaded backend for: ${extName}`);
                        }
                    }
                } catch (err) {
                    console.error(`[Extension] Failed to load extension ${extName}:`, err.message);
                }
            }
        }
    });
}

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
        if (handler(req, res, parsedUrl, pathname)) {
            return;
        }
    }

    // Static File Serving Fallback: Resolve and serve static web assets from either the /extensions root or the 
    // client public directory.
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