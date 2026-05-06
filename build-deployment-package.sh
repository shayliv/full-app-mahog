#!/bin/bash
# Build deployment package for offline/on-premise installation
# Usage: ./build-deployment-package.sh [full|update]

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DATE=$(date +%Y%m%d-%H%M)
MODE=${1:-full}  # full or update

echo "🚀 Building ARMI Deployment Package..."
echo "Mode: $MODE"
echo "Date: $DATE"
echo ""

# Step 1: Build Frontend
echo "📦 Step 1: Building Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Running npm install..."
    npm install
fi

echo "Building production bundle..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed - dist directory not created"
    exit 1
fi

echo "✅ Frontend built successfully"
echo ""

# Step 2: Package Python Dependencies (full mode only)
if [ "$MODE" = "full" ]; then
    echo "📦 Step 2: Packaging Python Dependencies..."
    cd ../backend

    if [ ! -d ".venv" ]; then
        echo "⚠️  Virtual environment not found. Creating..."
        python3 -m venv .venv
    fi

    source .venv/bin/activate

    echo "Downloading Python packages for offline installation..."
    mkdir -p python-packages
    pip download -r requirements.txt -d python-packages

    echo "✅ Python packages downloaded"
    echo ""
else
    echo "📦 Step 2: Skipping Python packages (update mode)"
    echo ""
fi

# Step 3: Create Archive
echo "📦 Step 3: Creating Deployment Archive..."
cd "$SCRIPT_DIR"

if [ "$MODE" = "full" ]; then
    ARCHIVE_NAME="armi-deployment-${DATE}.tar.gz"
    PYTHON_PACKAGES="backend/python-packages/"
else
    ARCHIVE_NAME="armi-update-${DATE}.tar.gz"
    PYTHON_PACKAGES=""
fi

echo "Archive name: $ARCHIVE_NAME"
echo "Creating tarball..."

tar -czf "$ARCHIVE_NAME" \
    --exclude='node_modules' \
    --exclude='.venv' \
    --exclude='frontend/.vite' \
    --exclude='backend/__pycache__' \
    --exclude='**/__pycache__' \
    --exclude='**/*.pyc' \
    --exclude='.git' \
    --exclude='*.tar.gz' \
    backend/*.py \
    backend/app/ \
    backend/requirements.txt \
    backend/migrate_db.py \
    $PYTHON_PACKAGES \
    frontend/dist/ \
    *.md \
    OFFLINE_DEPLOYMENT.md \
    deploy-to-server.sh

if [ ! -f "$ARCHIVE_NAME" ]; then
    echo "❌ Archive creation failed"
    exit 1
fi

ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)
echo "✅ Archive created: $ARCHIVE_NAME ($ARCHIVE_SIZE)"
echo ""

# Step 4: Create Checksum
echo "📦 Step 4: Creating Checksum..."
sha256sum "$ARCHIVE_NAME" > "${ARCHIVE_NAME}.sha256"
echo "✅ Checksum created: ${ARCHIVE_NAME}.sha256"
echo ""

# Step 5: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deployment Package Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Package: $ARCHIVE_NAME"
echo "📏 Size: $ARCHIVE_SIZE"
echo "🔐 Checksum: ${ARCHIVE_NAME}.sha256"
echo ""
echo "📋 Next Steps:"
echo "1. Transfer $ARCHIVE_NAME to target server"
echo "2. Run: tar -xzf $ARCHIVE_NAME"
if [ "$MODE" = "full" ]; then
    echo "3. Follow OFFLINE_DEPLOYMENT.md for initial setup"
else
    echo "3. Follow OFFLINE_DEPLOYMENT.md Step 4.2 for update"
fi
echo ""
echo "📚 Documentation: OFFLINE_DEPLOYMENT.md"
echo ""

# Optional: List contents
echo "📄 Package Contents:"
tar -tzf "$ARCHIVE_NAME" | head -20
echo "... (showing first 20 items)"
echo ""

echo "✅ Build complete!"
