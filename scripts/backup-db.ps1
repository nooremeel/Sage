# Sage Database Backup Script (PowerShell)
# Usage: ./scripts/backup-db.ps1

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $rootDir ".env"

if (-not (Test-Path $envFile)) {
    Write-Error "Could not find .env file at $envFile"
    exit 1
}

# Parse DATABASE_URL from .env
$dbUrl = ""
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*DATABASE_URL_UNPOOLED\s*=\s*(.+)$") {
        $dbUrl = $matches[1].Trim().Trim('"').Trim("'")
    } elseif (-not $dbUrl -and $_ -match "^\s*DATABASE_URL\s*=\s*(.+)$") {
        $dbUrl = $matches[1].Trim().Trim('"').Trim("'")
    }
}

if (-not $dbUrl) {
    Write-Error "DATABASE_URL not found in .env"
    exit 1
}

$backupDir = Join-Path $rootDir "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFile = Join-Path $backupDir "sage_db_backup_$timestamp.sql"

Write-Host "[Backup] Dumping PostgreSQL database to $dumpFile..." -ForegroundColor Cyan

# Check for pg_dump
if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
    pg_dump --dbname="$dbUrl" --clean --if-exists --no-owner --no-privileges -f "$dumpFile"
    Write-Host "[Backup] Backup successfully created at: $dumpFile" -ForegroundColor Green
} else {
    Write-Warning "pg_dump binary not found in PATH. Ensure PostgreSQL client tools are installed."
    Write-Host "Command to run when pg_dump is available:"
    Write-Host "pg_dump --dbname=`"$dbUrl`" --clean --if-exists -f `"$dumpFile`"" -ForegroundColor Yellow
}

