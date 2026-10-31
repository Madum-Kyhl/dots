const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'bits.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to SQLite database', err);
    } else {
        console.log('Connected to SQLite database at', dbPath);
    }
});

// Load and execute core schema from an external file
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.serialize(() => {
        db.exec(schemaSql, (err) => {
            if (err) {
                console.error('Failed to execute core database schema:', err.message);
            } else {
                console.log('Core database schema initialized successfully.');
            }
        });
    });
} else {
    console.warn('Warning: Core schema file (server/schema.sql) not found.');
}

module.exports = db;