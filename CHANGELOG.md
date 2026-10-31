<!-- markdownlint-disable MD024 -->

# Changelog

All notable changes to this project will be documented in this file.

## [0.5.1] - 2026-10-31

### Changed

- Refacteder out `extensionsManager` from `server`.
- Support for toggling apps off.

## [0.5.0] - 2026-10-30

### Changed

- Restructed to support `bits` as umpbrella and move out `crumps` and `dots` as extensions.
- Redesigned and rebranded `dots` into its version [0.1.0]

## [0.4.0] - 2026-10-29

### Added

- Added meal planner feature `crumbs`.
- Allows all to edit meals, chefs, and participation.

### Changed

- Disable task manager `dots` for now and rebranded main page `bits` as an umbrella.
- Reversed the order in the changelog.

## [0.3.1] - 2026-10-25

### Added

- `.dockerignore` file to optimize the Docker build context and exclude unnecessary workspace files.

### Changed

- Updated root `.gitignore` to comprehensively ignore the `data/` directory and SQLite database files.
- Refined `README.md` by removing obsolete legacy data migration instructions.

### Removed

- Legacy `tasks.csv` file and `data/migrate.js` migration script now that SQLite auto-initialization is fully established.

## [0.3.0] - 2026-10-25

### Added

- SQLite persistence layer (`data/dots.db`) replacing the legacy CSV storage.
- Auto-initialization of the database schema on server startup.
- Node-based legacy data migration script (`data/migrate.js`).
- REST API endpoints for fetching, adding, and toggling task states.
- Docker volume mounting for `/app/data` to ensure container persistence.

### Changed

- Migrated frontend `state.js` and `ui.js` to communicate with REST APIs using task IDs.
- Updated `Dockerfile` and `docker-compose.yml` to build backend dependencies cleanly.

## [Unreleased] - Roadmap / Planned

### Added

- Proper `.dockerignore` and `.gitignore` rules for SQLite databases and build directories.
- GitHub Actions workflow (`ci.yml`) to automatically test Node builds.
- Branch protection and mandatory PR reviews/status checks on `main`.
- Schema expansion to include task priority and explicit `created_at` timestamps.
- Table/column sorting and filtering controls in the UI.
- Finalized documentation, environment configuration profiles, and robust error handling.

## [0.2.0] - 2026-10-24

### Added

- Setup Ubuntu server Docker deployment runner.
- "New Task" input form for user task creation.
- Dual-box layout separating Pending Tasks (TODO) and Completed Tasks (DONE).
- MIME-type handling for static ES module serving.

### Changed

- Refactored and organized frontend architecture into modular components (`app.js`, `state.js`, `ui.js`).
- Implemented task status updates and local disk writeback mechanisms.

## [0.1.0] - 2026-10-24

### Added

- Initial project conception and project naming.
- Local Git repository initialization and GitHub remote linking.
- MVP zero-friction CSV task backlog structure (`tasks.csv`).
- Raw HTML index prototype for initial task viewing.
- CSV parsing mechanism to display tasks in a raw HTML list.
- Comprehensive README documentation covering local test server options (Live Server, `npx serve`, Python).
