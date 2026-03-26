#!/usr/bin/env bash
# load-and-start.sh — Load pre-saved Docker images and start the app (offline install).
# Run this script on the offline machine after copying the project directory.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
IMAGE_DIR="$PROJECT_DIR/offline-images"

if [ ! -d "$IMAGE_DIR" ]; then
  echo "ERROR: offline-images/ directory not found at $IMAGE_DIR"
  echo "Run scripts/save-offline.sh on an internet-connected machine first."
  exit 1
fi

echo "==> Loading Docker images from $IMAGE_DIR ..."
for archive in "$IMAGE_DIR"/*.tar.gz; do
  echo "    Loading $archive ..."
  docker load < "$archive"
done

echo ""
echo "==> Starting application..."
cd "$PROJECT_DIR"
docker compose up -d

echo ""
echo "==> Application started!"
echo "    Frontend: http://localhost"
echo "    Backend:  http://localhost:8001"
echo ""
echo "To check logs:  docker compose logs -f"
echo "To stop:        docker compose down"
