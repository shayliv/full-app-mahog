#!/bin/bash
# Deploy ARMI system to on-premise server
# Usage: ./deploy-to-server.sh [install|update]

set -e  # Exit on error

MODE=${1:-update}  # install or update
INSTALL_DIR="/opt/armi"

echo "🚀 ARMI Deployment Script"
echo "Mode: $MODE"
echo "Target: $INSTALL_DIR"
echo ""

# Check if running as root (needed for systemd)
if [ "$EUID" -ne 0 ] && [ "$MODE" = "install" ]; then
    echo "⚠️  Note: Some operations may require sudo privileges"
fi

# Create installation directory
if [ ! -d "$INSTALL_DIR" ]; then
    echo "📁 Creating installation directory..."
    sudo mkdir -p "$INSTALL_DIR"
    echo "✅ Directory created"
fi

cd "$INSTALL_DIR"

# Backup existing installation (update mode)
if [ "$MODE" = "update" ] && [ -d "backend" ]; then
    echo "💾 Backing up current installation..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M).tar.gz"
    tar -czf "$BACKUP_NAME" backend/ frontend/ 2>/dev/null || true
    echo "✅ Backup created: $BACKUP_NAME"
    echo ""
fi

# Stop services if updating
if [ "$MODE" = "update" ]; then
    echo "⏸️  Stopping services..."
    sudo systemctl stop armi-backend 2>/dev/null || echo "Backend service not running"
    echo ""
fi

# Extract deployment package (assumes it's already transferred here)
echo "📦 Looking for deployment package..."
PACKAGE=$(ls -t armi-*.tar.gz 2>/dev/null | head -1)

if [ -z "$PACKAGE" ]; then
    echo "❌ No deployment package found in $INSTALL_DIR"
    echo "Please transfer armi-deployment-*.tar.gz or armi-update-*.tar.gz to this directory"
    exit 1
fi

echo "Found: $PACKAGE"
echo "Extracting..."
tar -xzf "$PACKAGE"
echo "✅ Files extracted"
echo ""

# Setup Backend
echo "🐍 Setting up Backend..."
cd "$INSTALL_DIR/backend"

if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

# Install dependencies
if [ -d "python-packages" ]; then
    echo "Installing Python packages from local files (offline mode)..."
    pip install --no-index --find-links=./python-packages -r requirements.txt
else
    echo "Installing Python packages from requirements.txt..."
    pip install -r requirements.txt
fi

echo "✅ Backend dependencies installed"
echo ""

# Configure database (install mode only)
if [ "$MODE" = "install" ]; then
    echo "⚙️  Database Configuration"
    echo ""
    read -p "Enter database host [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}

    read -p "Enter database name [armi_db]: " DB_NAME
    DB_NAME=${DB_NAME:-armi_db}

    read -p "Enter database user [armi_user]: " DB_USER
    DB_USER=${DB_USER:-armi_user}

    read -sp "Enter database password: " DB_PASS
    echo ""

    echo "Creating .env file..."
    cat > .env << EOF
DATABASE_URL=mysql+pymysql://${DB_USER}:${DB_PASS}@${DB_HOST}:3306/${DB_NAME}
APP_NAME=ARMI System
EOF
    echo "✅ Configuration saved"
    echo ""
fi

# Run database migrations
echo "🗄️  Running Database Migrations..."
echo "Checking migration status..."
python migrate_db.py --dry-run

echo ""
read -p "Apply migrations? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python migrate_db.py
    echo "✅ Migrations applied"
else
    echo "⏭️  Skipped migrations"
fi
echo ""

# Setup Systemd Service (install mode only)
if [ "$MODE" = "install" ]; then
    echo "⚙️  Setting up Systemd Service..."

    sudo tee /etc/systemd/system/armi-backend.service > /dev/null << EOF
[Unit]
Description=ARMI Backend API Service
After=network.target mysql.service

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$INSTALL_DIR/backend
Environment="PATH=$INSTALL_DIR/backend/.venv/bin"
ExecStart=$INSTALL_DIR/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable armi-backend
    echo "✅ Service configured"
    echo ""
fi

# Setup Nginx (install mode only)
if [ "$MODE" = "install" ]; then
    echo "⚙️  Setting up Nginx..."

    read -p "Enter server name/domain [armi.local]: " SERVER_NAME
    SERVER_NAME=${SERVER_NAME:-armi.local}

    sudo tee /etc/nginx/sites-available/armi > /dev/null << EOF
server {
    listen 80;
    server_name $SERVER_NAME;

    # Frontend (static files)
    location / {
        root $INSTALL_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files (uploads, images)
    location /static {
        proxy_pass http://127.0.0.1:8000;
    }

    # API documentation
    location /docs {
        proxy_pass http://127.0.0.1:8000;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000;
    }

    client_max_body_size 10M;
}
EOF

    sudo ln -sf /etc/nginx/sites-available/armi /etc/nginx/sites-enabled/
    sudo nginx -t
    echo "✅ Nginx configured"
    echo ""
fi

# Create upload directories
echo "📁 Setting up upload directories..."
mkdir -p "$INSTALL_DIR/backend/static/uploads"
chmod -R 755 "$INSTALL_DIR/backend/static"
echo "✅ Upload directories ready"
echo ""

# Start services
echo "▶️  Starting Services..."
sudo systemctl start armi-backend
sudo systemctl reload nginx 2>/dev/null || sudo systemctl restart nginx
echo "✅ Services started"
echo ""

# Verification
echo "🔍 Verifying Deployment..."
sleep 2

echo "Backend status:"
sudo systemctl status armi-backend --no-pager | head -10

echo ""
echo "Backend health check:"
curl -s http://localhost:8000/health || echo "⚠️  Backend not responding yet (may need a few seconds)"

echo ""
echo "Nginx status:"
sudo systemctl status nginx --no-pager | head -5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Summary:"
echo "  Mode: $MODE"
echo "  Installation: $INSTALL_DIR"
echo "  Backend: http://localhost:8000"
echo "  Frontend: http://localhost/ or http://$SERVER_NAME"
echo ""
echo "📝 Next Steps:"
echo "  1. Open browser to http://localhost/"
echo "  2. Login and verify features work"
echo "  3. Check FEATURE_CHECKLIST.md for testing"
echo ""
echo "🔧 Useful Commands:"
echo "  View logs: sudo journalctl -u armi-backend -f"
echo "  Restart: sudo systemctl restart armi-backend"
echo "  Stop: sudo systemctl stop armi-backend"
echo ""
echo "✅ Deployment successful!"
