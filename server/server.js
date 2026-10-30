const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./database');
const handleCrumbsApi = require('../extensions/crumbs/backend');

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

    // API: Get all tasks
    if (pathname === '/api/tasks' && req.method === 'GET') {
        db.all("SELECT id, status, title FROM tasks ORDER BY id ASC", [], (err, rows) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        });
        return;
    }

    // API: Add a new task
    if (pathname === '/api/tasks' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { title } = JSON.parse(body);
                if (!title) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Title is required' }));
                    return;
                }
                db.run("INSERT INTO tasks (status, title) VALUES (?, ?)", ['TODO', title], function(err) {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: err.message }));
                        return;
                    }
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ id: this.lastID, status: 'TODO', title }));
                });
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // API: Toggle task status (e.g. /api/tasks/4/toggle)
    if (pathname.startsWith('/api/tasks/') && pathname.endsWith('/toggle') && req.method === 'POST') {
        const parts = pathname.split('/');
        const id = parts[3];

        db.get("SELECT status FROM tasks WHERE id = ?", [id], (err, row) => {
            if (err || !row) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Task not found' }));
                return;
            }
            const newStatus = row.status === 'TODO' ? 'DONE' : 'TODO';
            db.run("UPDATE tasks SET status = ? WHERE id = ?", [newStatus, id], (err) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ id, status: newStatus }));
            });
        });
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