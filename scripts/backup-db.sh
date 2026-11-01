#!/usr/bin/env bash
# Sage Database Backup Script (POSIX Bash)
# Usage: ./scripts/backup-db.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE" >&2
  exit 1
fi

DB_URL=$(grep -E '^\s*DATABASE_URL_UNPOOLED=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'") || true
if [ -z "$DB_URL" ]; then
  DB_URL=$(grep -E '^\s*DATABASE_URL=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'") || true
fi

if [ -z "$DB_URL" ]; then
  echo "Error: DATABASE_URL not found in .env" >&2
  exit 1
fi

BACKUP_DIR="$ROOT_DIR/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_FILE="$BACKUP_DIR/sage_db_backup_${TIMESTAMP}.sql"

echo "[Backup] Dumping PostgreSQL database to $DUMP_FILE..."

if command -v pg_dump >/dev/null 2>&1; then
  pg_dump --dbname="$DB_URL" --clean --if-exists --no-owner --no-privileges -f "$DUMP_FILE"
  echo "[Backup] Backup successfully created at $DUMP_FILE"
else
  echo "Warning: pg_dump not found in PATH." >&2
  echo "Run manually when pg_dump is available:" >&2
  echo "pg_dump --dbname=\"$DB_URL\" --clean --if-exists -f \"$DUMP_FILE\"" >&2
fi

