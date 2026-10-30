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

// Initialize full schema once
db.serialize(() => {
    // 1. Core task management table
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status TEXT NOT NULL DEFAULT 'TODO',
            title TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 2. Users table for chefs and participants
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            initials TEXT NOT NULL
        )
    `);

    // 3. Crumbs (meals) scheduled by week and day
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

    // 4. Participant sign-ups and attendance tracking
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

module.exports = db;