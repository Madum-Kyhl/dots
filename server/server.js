const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./database');

const PORT = 8080;
const PUBLIC_DIR = path.join(process.cwd(), 'client');

http.createServer((req, res) => {
    // Log all incoming requests to Docker console
    console.log(`[HTTP] ${req.method} ${req.url}`);
    
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

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

    // API: Get crumbs (meals) for a specific week with signups
    if (pathname === '/api/crumbs' && req.method === 'GET') {
        const weekNum = parsedUrl.searchParams.get('week') || '44';
        
        const query = `
            SELECT c.id, c.day_name, c.meal_title, c.date, c.chef_id, u.name as chef_name
            FROM crumbs c
            LEFT JOIN users u ON c.chef_id = u.id
            WHERE c.week_number = ?
            ORDER BY c.id ASC
        `;

        db.all(query, [weekNum], (err, crumbs) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
                return;
            }

            if (crumbs.length === 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([]));
                return;
            }

            const crumbIds = crumbs.map(c => c.id);
            const placeholders = crumbIds.map(() => '?').join(',');
            
            const signupsQuery = `
                SELECT s.crumb_id, s.status, s.note, u.initials
                FROM crumb_signups s
                JOIN users u ON s.user_id = u.id
                WHERE s.crumb_id IN (${placeholders})
            `;

            db.all(signupsQuery, crumbIds, (err, signups) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                    return;
                }

                const result = crumbs.map(crumb => {
                    const crumbSignups = signups
                        .filter(s => s.crumb_id === crumb.id)
                        .map(s => ({ initials: s.initials, status: s.status, note: s.note }));

                    return {
                        ...crumb,
                        signups: crumbSignups
                    };
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            });
        });
        return;
    }

    // API: Toggle or update participant signup status for a crumb
    if (pathname.startsWith('/api/crumbs/') && pathname.endsWith('/signup') && req.method === 'POST') {
        const parts = pathname.split('/');
        const crumbId = parts[3];

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { initials, status } = JSON.parse(body);
                if (!initials || !status) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Initials and status are required' }));
                    return;
                }

                // First find the user_id from initials
                db.get("SELECT id FROM users WHERE initials = ?", [initials], (err, user) => {
                    if (err || !user) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'User not found' }));
                        return;
                    }

                    const userId = user.id;

                    // Upsert signup status
                    const upsertQuery = `
                        INSERT INTO crumb_signups (crumb_id, user_id, status)
                        VALUES (?, ?, ?)
                        ON CONFLICT(crumb_id, user_id) 
                        DO UPDATE SET status = excluded.status
                    `;

                    db.run(upsertQuery, [crumbId, userId, status], function(err) {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: err.message }));
                            return;
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, crumb_id: crumbId, initials, status }));
                    });
                });
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // API: Upsert or update meal title for a specific date/crumb
    if (pathname === '/api/crumbs/update' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { crumbId, date, weekNumber, year, dayName, mealTitle } = JSON.parse(body);
                if (!date || !weekNumber || !dayName || mealTitle === undefined) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }

                const currentYear = year || new Date().getFullYear();

                const upsertQuery = `
                    INSERT INTO crumbs (date, week_number, year, day_name, meal_title)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(date) 
                    DO UPDATE SET meal_title = excluded.meal_title
                `;

                db.run(upsertQuery, [date, weekNumber, currentYear, dayName, mealTitle], function(err) {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: err.message }));
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, meal_title: mealTitle }));
                });
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // API: Get all users for chef selection dropdown
    if (pathname === '/api/users' && req.method === 'GET') {
        db.all("SELECT id, name, initials FROM users ORDER BY id ASC", [], (err, rows) => {
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

    // API: Update or clear chef for a crumb/meal
    if (pathname === '/api/crumbs/chef' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { date, weekNumber, year, dayName, chefId } = JSON.parse(body);
                if (!date || !weekNumber || !dayName) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }
                const currentYear = year || new Date().getFullYear();
                const parsedChefId = (chefId === undefined || chefId === null || chefId === "null") ? null : chefId;

                const upsertQuery = `
                    INSERT INTO crumbs (date, week_number, year, day_name, meal_title, chef_id)
                    VALUES (?, ?, ?, ?, COALESCE((SELECT meal_title FROM crumbs WHERE date = ?), 'Ikke planlagt endnu...'), ?)
                    ON CONFLICT(date) 
                    DO UPDATE SET chef_id = excluded.chef_id
                `;

                db.run(upsertQuery, [date, weekNumber, currentYear, dayName, date, parsedChefId], function(err) {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: err.message }));
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, chef_id: parsedChefId }));
                });
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // Serve static frontend/client files with correct MIME types
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