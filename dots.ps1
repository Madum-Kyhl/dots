param([string]$action)

switch ($action) {
    "--node" { 
        Write-Host "Starting .dots locally with Node.js..."
        node backend/server.js 
    }
    "--docker" { 
        Write-Host "Starting .dots via Docker Compose..."
        docker compose up -d --build 
    }
    "--web" {
        Write-Host "Opening .dots in browser..."
        Start-Process "http://localhost:8080"
    }
    "--down" { 
        Write-Host "Tearing down Docker containers..."
        docker compose down 
    }
    default {
        Write-Host "Usage: .\scripts\dots.ps1 [--node | --docker | --down]"
    }
}