const fs = require('fs');
const path = require('path');
const sqlite3 = require('../backend/node_modules/sqlite3').verbose();

const dbPath = path.join(__dirname, 'dots.db');
const csvPath = path.join(__dirname, 'tasks.csv');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
        process.exit(1);
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status TEXT NOT NULL DEFAULT 'TODO',
            title TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, () => {
        // Clear existing rows to avoid duplicates
        db.run("DELETE FROM tasks", () => {
            if (!fs.existsSync(csvPath)) {
                console.log('No tasks.csv found to migrate.');
                db.close();
                return;
            }

            const content = fs.readFileSync(csvPath, 'utf8');
            const lines = content.trim().split('\n');

            const stmt = db.prepare("INSERT INTO tasks (status, title) VALUES (?, ?)");
            
            // Skip index 0 (header row)
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Handle basic CSV comma splitting (or titles containing commas)
                const firstComma = line.indexOf(',');
                if (firstComma === -1) continue;
                
                const status = line.substring(0, firstComma).trim();
                const title = line.substring(firstComma + 1).trim();
                
                stmt.run(status, title);
            }

            stmt.finalize(() => {
                console.log('Migration completed successfully from tasks.csv to dots.db!');
                db.close();
            });
        });
    });
});