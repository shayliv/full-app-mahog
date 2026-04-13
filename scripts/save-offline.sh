#!/usr/bin/env bash
# save-offline.sh — Build images and save them as tar files for offline installation.
# Run this script on a machine WITH internet access, then copy the entire project
# (including the generated offline-images/ directory) to the offline machine.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/offline-images"

echo "==> Building Docker images for linux/amd64 platform..."
cd "$PROJECT_DIR"
docker build --platform linux/amd64 -t student-crm-backend:latest ./backend
docker build --platform linux/amd64 -t student-crm-frontend:latest ./frontend

echo ""
echo "==> Pulling MySQL image for linux/amd64 (if not already present)..."
docker pull --platform linux/amd64 mysql:8.0

echo ""
echo "==> Saving images to $OUTPUT_DIR ..."
mkdir -p "$OUTPUT_DIR"

docker save student-crm-backend:latest  | gzip > "$OUTPUT_DIR/student-crm-backend.tar.gz"
docker save student-crm-frontend:latest | gzip > "$OUTPUT_DIR/student-crm-frontend.tar.gz"
docker save mysql:8.0                   | gzip > "$OUTPUT_DIR/mysql-8.0.tar.gz"

echo ""
echo "==> Done! Files saved:"
ls -lh "$OUTPUT_DIR"
echo ""
echo "Transfer the entire project directory (including offline-images/) to the"
echo "offline machine, then run:  ./scripts/load-and-start.sh"
