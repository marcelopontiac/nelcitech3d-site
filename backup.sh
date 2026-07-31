#!/usr/bin/env bash
set -euo pipefail

PROJECT="/home/marcelotech/nelcitech3d-site"
OPENTEST="/home/marcelotech/Default Project/opentest"
BACKUP_DIR="/home/marcelotech/backups"
KEEP=14
STAMP="$(date +%Y-%m-%d_%H-%M-%S)"
LOG="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"

backup() {
  local NAME="$1" SRC_DIR="$2" SRC_FOLDER="$3"
  shift 3
  local FILE="$BACKUP_DIR/${NAME}-$STAMP.tar.gz"
  tar -czf "$FILE" "$@" -C "$SRC_DIR" "$SRC_FOLDER"
  echo "$(date '+%Y-%m-%d %H:%M:%S') backup criado: $FILE ($(du -h "$FILE" | cut -f1))" >> "$LOG"
  echo "Backup: $FILE"
  ls -1t "$BACKUP_DIR"/${NAME}-*.tar.gz 2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm -f
}

# Backup NelciTech3D
backup "nelcitech3d" "/home/marcelotech" "nelcitech3d-site" \
  --exclude="nelcitech3d-site/frontend/node_modules" \
  --exclude="nelcitech3d-site/frontend/dist" \
  --exclude="nelcitech3d-site/backend/__pycache__" \
  --exclude="nelcitech3d-site/backend/nelci.db" \
  --exclude="nelcitech3d-site/downloads" \
  --exclude="nelcitech3d-site/.git"

# Backup OpenTest
backup "opentest" "/home/marcelotech/Default Project" "opentest" \
  --exclude="opentest/backend/venv" \
  --exclude="opentest/backend/__pycache__" \
  --exclude="opentest/backend/opentest.db-journal" \
  --exclude="opentest/frontend/node_modules" \
  --exclude="opentest/frontend/dist" \
  --exclude="opentest/.git" \
  --exclude="opentest/backups" \
  --exclude="opentest/opentest-deploy.tar.gz" \
  --exclude="opentest/nohup.out"
