const db = require('../../server/database');

// --- Transport & Utility Helpers ---

const sendJson = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

const parseJsonBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error('Invalid JSON'));
            }
        });
    });
};

// --- Extension Table Self-Initialization ---

db.run(`
    CREATE TABLE IF NOT EXISTS dots_dots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT NOT NULL DEFAULT 'dots',
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('[Dots Extension] Failed to create dots_dots table:', err.message);
    } else {
        console.log('[Dots Extension] dots_dots table verified/created successfully.');
    }
});

// --- Route Handlers & Data Access ---

function handleDotsApi(req, res, _parsedUrl, pathname) {
    // API: Get all dots
    if (pathname === '/api/dots' && req.method === 'GET') {
        db.all("SELECT id, status, title FROM dots_dots ORDER BY id ASC", [], (err, rows) => {
            if (err) return sendJson(res, 500, { error: err.message });
            sendJson(res, 200, rows);
        });
        return true;
    }

    // API: Add a new dots
    if (pathname === '/api/dots' && req.method === 'POST') {
        parseJsonBody(req)
            .then(({ title }) => {
                if (!title) {
                    sendJson(res, 400, { error: 'Title is required' });
                    return;
                }
                db.run("INSERT INTO dots_dots (status, title) VALUES (?, ?)", ['dots', title], function(err) {
                    if (err) return sendJson(res, 500, { error: err.message });
                    sendJson(res, 201, { id: this.lastID, status: 'dots', title });
                });
            })
            .catch(() => sendJson(res, 400, { error: 'Invalid JSON' }));
        return true;
    }

    // API: Toggle dot status
    const toggleMatch = pathname.match(/^\/api\/dots\/(\d+)\/toggle$/);
    if (toggleMatch && req.method === 'POST') {
        const id = toggleMatch[1];

        db.get("SELECT status FROM dots_dots WHERE id = ?", [id], (err, row) => {
            if (err || !row) return sendJson(res, 404, { error: 'Dot not found' });
            
            const newStatus = row.status === 'dots' ? 'done' : 'dots';
            db.run("UPDATE dots_dots SET status = ? WHERE id = ?", [newStatus, id], (err) => {
                if (err) return sendJson(res, 500, { error: err.message });
                sendJson(res, 200, { id, status: newStatus });
            });
        });
        return true;
    }

    return false;
}

module.exports = handleDotsApi;