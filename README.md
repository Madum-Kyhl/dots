# .dots

A minimal, raw-HTML (WIP) task workspace.

## Running Locally

Because modern browsers block local file loading (`file://`) via CORS security policies, serve the directory locally using one of these zero-config methods:

### Option 1: Node.js (Recommended — Supports LAN Access)

To install Node.js run `winget install OpenJS.NodeJS.LTS`
In the project root run `npx serve`
> Note: If `npx` is not recognized, refresh your terminal path: `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`

### Option 2: VS Code Live Server

Install the *Live Server* extension by Ritwick Dey in VS Code.
Right-click `index.html` in the sidebar and select **Open with Live Server**.

### option 3: Python

In the project root run `python -m http.server 3000`

## Running locally via Docker

To install Docker Desktop run `winget install Docker.DockerDesktop` (can be skipped if already installed)
> Note: If `docker` is not recognized, refresh your terminal path: `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`
> Note: Docker Desktop requires the Virtual Machine Platform feature enabled. If you encounter a backend error, run this command in an **Administrator PowerShell** and restart your computer: `Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform`

### Using Docker Compose (Recommended)

To build and start in background mode run `docker compose up -d --build`
To access locally open your browser and navigate to <http://localhost:8080> or <http://127.0.0.1:8080>
To access through LAN open your browser and navigate to <http://{your-host-ip-address}:8080>
To tear down the container run `docker compose down`

### Using manual Docker workflow

To build the Docker image run `docker build -t dots:latest .`
To map the port 8080 run `docker run -d -p 8080:80 --name dots-local dots:latest`

### Cleaning up Docker builds

To stop the local container run `docker stop dots-local`
To remove the local container run `docker rm dots-local`

## Running remotely on server via Docker

To remote into your server via SSH run `ssh username@your-ubuntu-server-ip`
To clone the repository run `git clone https://github.com/Madum-Kyhl/dots.git` then `cd dots`
To build and start in background mode run `docker compose up -d --build`
To access your app open your browser and navigate to <http://{your-server-ip-address}:8080>
To tear down the container run `docker compose down`
To stop the local container run `docker stop dots-local`
To remove the local container run `docker rm dots-local`
