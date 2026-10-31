const db = require('../../server/database');

// Initialize crumbs-specific tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS crumbs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            week_number INTEGER NOT NULL,
            year INTEGER NOT NULL,
            day_name TEXT NOT NULL,
            meal_title TEXT NOT NULL,
            chef_id INTEGER,
            FOREIGN KEY (chef_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS crumb_signups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crumb_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('yes', 'no', 'maybe')),
            note TEXT,
            FOREIGN KEY (crumb_id) REFERENCES crumbs(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(crumb_id, user_id)
        )
    `);
});

function handleCrumbsApi(req, res, parsedUrl, pathname) {
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
        return true;
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
                    return { ...crumb, signups: crumbSignups };
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            });
        });
        return true;
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
        return true;
    }

    // API: Upsert or update meal title for a specific date/crumb
    if (pathname === '/api/crumbs/update' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { date, weekNumber, year, dayName, mealTitle } = JSON.parse(body);
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
        return true;
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

                db.get("SELECT id FROM users WHERE initials = ?", [initials], (err, user) => {
                    if (err || !user) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'User not found' }));
                        return;
                    }

                    const upsertQuery = `
                        INSERT INTO crumb_signups (crumb_id, user_id, status)
                        VALUES (?, ?, ?)
                        ON CONFLICT(crumb_id, user_id) 
                        DO UPDATE SET status = excluded.status
                    `;

                    db.run(upsertQuery, [crumbId, user.id, status], function(err) {
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
        return true;
    }

    return false;
}

module.exports = handleCrumbsApi;