# .dots

A lightweight, local-first, containerized task management application designed for simplicity, speed, and strict modularity.

## Architecture and Tech Stack

- **Backend**: Node.js REST API using SQLite (`sqlite3`) for robust data persistence.
- **Frontend**: ES Module-based architecture (`app.js`, `state.js`, `ui.js`) interacting via REST endpoints (`/api/tasks`).
- **Containerization**: Docker and Docker Compose with volume mapping for persistent data storage (`/app/data`).

## Prerequisites and Installation

To run `.dots` workspace locally with full disk persistence (or via container), you need **Node.js** and **Docker** installed.

### Install Node.js

Run `winget install OpenJS.NodeJS.LTS`
> Note: If `node` is not recognized, refresh your terminal path: `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`

### Install sqlite3

```bash
cd backend
npm install sqlite3
```

### Install Docker

Run `winget install Docker.DockerDesktop`
> Note: If `docker` is not recognized, refresh your terminal path: `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`
> Note: Docker Desktop requires the Virtual Machine Platform feature enabled. If you encounter a backend error, run this command in an **Administrator PowerShell** and restart your computer: `Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform`

## Running Locally (Node.js)

Run `node server.js`
Open your browser and navigate to <http://localhost:8080>
> Note: To stop the server and free up your terminal, press **`Ctrl + C`**.

## Running Docker

### Using Docker Compose (Recommended)

To build and start in background mode run `docker compose up -d --build`
To access locally open your browser and navigate to <http://localhost:8080> or <http://127.0.0.1:8080>
To access through LAN open your browser and navigate to <http://{your-host-ip-address}:8080>
To tear down the container run `docker compose down`

### Using manual Docker workflow

To build the Docker image run `docker build -t dots:latest .`
To run the container and map port 8080 run `docker run -d -p 8080:8080 --name dots-local dots:latest`
To stop the local container run `docker stop dots-local`
To remove the local container run `docker rm dots-local`

## Running remotely on server via Docker

To remote into your server via SSH run `ssh username@your-ubuntu-server-ip`
To clone the repository run `git clone https://github.com/Madum-Kyhl/dots.git` then `cd dots`
To build and start in background mode run `docker compose up -d --build`
To access your app open your browser and navigate to <http://{your-server-ip-address}:8080>
To tear down the container run `docker compose down`

## Versioning and Changelog

See CHANGELOG.md for a detailed history of changes across versions.
