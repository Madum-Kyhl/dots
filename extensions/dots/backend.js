const db = require('../../server/database');

// Initialize dots-specific tables
db.run(`
    CREATE TABLE IF NOT EXISTS dots_dots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT NOT NULL DEFAULT 'dots',
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

function handleDotsApi(req, res, parsedUrl, pathname) {
    // API: Get all dots
    if (pathname === '/api/dots' && req.method === 'GET') {
        db.all("SELECT id, status, title FROM dots_dots ORDER BY id ASC", [], (err, rows) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        });
        return true;
    }

    // API: Add a new dots
    if (pathname === '/api/dots' && req.method === 'POST') {
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
                db.run("INSERT INTO dots_dots (status, title) VALUES (?, ?)", ['dots', title], function(err) {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: err.message }));
                        return;
                    }
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ id: this.lastID, status: 'dots', title }));
                });
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return true;
    }

    // API: Toggle dot status
    if (pathname.startsWith('/api/dots/') && pathname.endsWith('/toggle') && req.method === 'POST') {
        const parts = pathname.split('/');
        const id = parts[3];

        db.get("SELECT status FROM dots_dots WHERE id = ?", [id], (err, row) => {
            if (err || !row) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Dot not found' }));
                return;
            }
            const newStatus = row.status === 'dots' ? 'done' : 'dots';
            db.run("UPDATE dots_dots SET status = ? WHERE id = ?", [newStatus, id], (err) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ id, status: newStatus }));
            });
        });
        return true;
    }

    return false;
}

module.exports = handleDotsApi;