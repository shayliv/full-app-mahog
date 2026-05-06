# 📦 Offline/On-Premise Deployment Guide

This guide explains how to deploy and update the ARMI system on an offline/on-premise server.

---

## 📋 Prerequisites on Target Server

### Required Software
- **Python 3.11+** installed
- **Node.js 18+** and npm installed
- **MySQL/MariaDB** database server running
- **nginx** or similar web server (for production)
- **systemd** (for service management - Linux)

### Required Files from This Repository
All files in this directory will be packaged for offline deployment.

---

## 📦 Step 1: Prepare Deployment Package (Development Machine)

### 1.1 Build Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run build        # Creates frontend/dist directory
```

### 1.2 Package Python Dependencies (Offline Wheels)
```bash
cd backend
source .venv/bin/activate

# Download all dependencies as wheel files for offline installation
pip download -r requirements.txt -d ./python-packages
```

### 1.3 Create Deployment Archive
```bash
cd /Users/shay/Projects/armi/fullapp
tar -czf armi-deployment-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.venv' \
  --exclude='frontend/.vite' \
  --exclude='backend/__pycache__' \
  --exclude='**/__pycache__' \
  --exclude='.git' \
  backend/ \
  frontend/dist/ \
  backend/python-packages/ \
  *.md
```

This creates: `armi-deployment-YYYYMMDD.tar.gz`

---

## 🚀 Step 2: Deploy to On-Premise Server

### 2.1 Transfer Files
Copy the deployment archive to the target server:
```bash
# Using SCP (if network access available)
scp armi-deployment-*.tar.gz user@server:/opt/armi/

# Or use USB drive for truly offline deployment
```

### 2.2 Extract on Server
```bash
cd /opt/armi
tar -xzf armi-deployment-*.tar.gz
```

### 2.3 Setup Backend (Python Virtual Environment)
```bash
cd /opt/armi/backend

# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate

# Install dependencies from local wheel files (offline)
pip install --no-index --find-links=./python-packages -r requirements.txt
```

### 2.4 Configure Database Connection
```bash
cd /opt/armi/backend

# Create .env file
cat > .env << EOF
DATABASE_URL=mysql+pymysql://armi_user:PASSWORD@localhost:3306/armi_db
APP_NAME=ARMI System
EOF

# Adjust database credentials as needed
```

### 2.5 Create Database and User
```sql
-- Run in MySQL as root
CREATE DATABASE IF NOT EXISTS armi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'armi_user'@'localhost' IDENTIFIED BY 'SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON armi_db.* TO 'armi_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2.6 Run Database Migration
```bash
cd /opt/armi/backend
source .venv/bin/activate

# Review what will change
python migrate_db.py --dry-run

# Apply migration
python migrate_db.py
```

Expected output:
```
✓ Successfully applied X change(s)
✅ Database migration completed successfully!
```

---

## 🔧 Step 3: Configure Production Services

### 3.1 Create Backend Systemd Service

```bash
sudo nano /etc/systemd/system/armi-backend.service
```

Add:
```ini
[Unit]
Description=ARMI Backend API Service
After=network.target mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/armi/backend
Environment="PATH=/opt/armi/backend/.venv/bin"
ExecStart=/opt/armi/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable armi-backend
sudo systemctl start armi-backend
sudo systemctl status armi-backend
```

### 3.2 Configure Nginx for Frontend

```bash
sudo nano /etc/nginx/sites-available/armi
```

Add:
```nginx
server {
    listen 80;
    server_name armi.local;  # Or your internal domain

    # Frontend (static files)
    location / {
        root /opt/armi/frontend/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (uploads, images)
    location /static {
        proxy_pass http://127.0.0.1:8000;
    }

    # API documentation
    location /docs {
        proxy_pass http://127.0.0.1:8000;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8000;
    }
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/armi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3.3 Configure Frontend API URL

Update frontend environment (if needed):
```bash
cd /opt/armi/frontend
cat > .env << EOF
VITE_API_URL=http://localhost:8000
EOF
```

**Note:** For production builds, the API URL should be relative or point to the production backend.

---

## 🔄 Step 4: Updating Existing Installation

When you need to update code on the on-premise server:

### 4.1 Prepare Update Package
```bash
# On development machine
cd /Users/shay/Projects/armi/fullapp

# Rebuild frontend
cd frontend
npm run build

# Create update package (lighter - no python packages)
cd ..
tar -czf armi-update-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.venv' \
  --exclude='frontend/.vite' \
  --exclude='backend/__pycache__' \
  --exclude='**/__pycache__' \
  --exclude='.git' \
  --exclude='backend/python-packages' \
  backend/ \
  frontend/dist/ \
  *.md
```

### 4.2 Apply Update on Server
```bash
# Transfer update package to server
scp armi-update-*.tar.gz user@server:/opt/armi/

# On server
cd /opt/armi

# Backup current installation
tar -czf backup-$(date +%Y%m%d-%H%M).tar.gz backend/ frontend/

# Stop services
sudo systemctl stop armi-backend

# Extract update (overwrites files)
tar -xzf armi-update-*.tar.gz

# Run database migrations (if any new changes)
cd backend
source .venv/bin/activate
python migrate_db.py

# Restart services
sudo systemctl start armi-backend
sudo systemctl reload nginx

# Verify
sudo systemctl status armi-backend
curl http://localhost:8000/health
```

---

## ✅ Verification Checklist

After deployment or update:

### Backend Health
- [ ] Service running: `sudo systemctl status armi-backend`
- [ ] API responding: `curl http://localhost:8000/health`
- [ ] Database connected: Check backend logs
- [ ] Migrations applied: `python migrate_db.py --dry-run` shows no pending changes

### Frontend Health
- [ ] Nginx serving files: `curl http://localhost/`
- [ ] Can access in browser: `http://armi.local` or server IP
- [ ] Login page loads
- [ ] No console errors (F12)

### Features Working
- [ ] Can log in
- [ ] Student list loads
- [ ] Rich text editors work (focus stays)
- [ ] File uploads work
- [ ] All tabs functional (Personal, Discipline, Medical, Summaries, Bakatzim)
- [ ] Database queries fast

---

## 🔍 Troubleshooting

### Backend Won't Start
```bash
# Check logs
sudo journalctl -u armi-backend -f

# Common issues:
# 1. Database connection - check .env file
# 2. Port already in use - check with: lsof -i :8000
# 3. Python dependencies missing - reinstall from requirements.txt
```

### Frontend Shows Blank Page
```bash
# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Check if files exist
ls -la /opt/armi/frontend/dist

# Common issues:
# 1. Wrong nginx root path
# 2. Permissions - ensure www-data can read files
# 3. API URL misconfigured
```

### Database Migration Fails
```bash
# Check database connection
mysql -u armi_user -p -h localhost armi_db

# Check migration script
cd /opt/armi/backend
source .venv/bin/activate
python migrate_db.py --dry-run

# If stuck, check:
# 1. Database credentials in .env
# 2. User has proper permissions
# 3. Database server running
```

### File Uploads Not Working
```bash
# Check upload directory exists and is writable
mkdir -p /opt/armi/backend/static/uploads
chown -R www-data:www-data /opt/armi/backend/static

# Check nginx configuration passes uploads
# Max upload size in nginx:
sudo nano /etc/nginx/nginx.conf
# Add: client_max_body_size 10M;
```

---

## 📊 Performance Tuning

### Backend Workers
Adjust based on CPU cores:
```bash
# In systemd service file:
ExecStart=... --workers 4  # 2x CPU cores
```

### Database Optimization
```sql
-- Add indexes for faster queries (if not already present)
CREATE INDEX idx_student_track ON student(track);
CREATE INDEX idx_student_class ON student(class_name);
CREATE INDEX idx_discipline_date ON disciplineevent(date);
CREATE INDEX idx_medical_start_date ON medicalevent(start_date);
```

### Nginx Caching
```nginx
# In nginx server block:
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🔐 Security Recommendations

### 1. Change Default Passwords
```bash
# MySQL user password
ALTER USER 'armi_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';

# Application admin password (in UI after first login)
```

### 2. Enable HTTPS (if possible)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (if domain available)
sudo certbot --nginx -d armi.yourdomain.com
```

### 3. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. Regular Backups
```bash
# Create backup script
cat > /opt/armi/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/armi"
DATE=$(date +%Y%m%d-%H%M)

# Database backup
mysqldump -u armi_user -p armi_db | gzip > $BACKUP_DIR/db-$DATE.sql.gz

# Files backup
tar -czf $BACKUP_DIR/files-$DATE.tar.gz /opt/armi/backend/static/uploads

# Keep last 30 days
find $BACKUP_DIR -mtime +30 -delete
EOF

chmod +x /opt/armi/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/armi/backup.sh
```

---

## 📝 Deployment Summary

### Initial Deployment
1. Build frontend: `npm run build`
2. Package dependencies: `pip download -r requirements.txt -d python-packages`
3. Create archive: `tar -czf armi-deployment.tar.gz ...`
4. Transfer to server
5. Extract and setup virtual environment
6. Configure database
7. Run migrations
8. Setup systemd and nginx
9. Start services

### Updates
1. Build frontend: `npm run build`
2. Create update archive (no python packages)
3. Transfer to server
4. Stop services
5. Backup current installation
6. Extract update
7. Run migrations
8. Restart services
9. Verify

---

## 🆘 Support Contacts

- **System Admin:** [Your Name/Email]
- **Database Issues:** [DBA Contact]
- **Network Issues:** [Network Team]

---

## 📚 Related Documentation

- [QUICK_START.md](QUICK_START.md) - Development setup
- [FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md) - Feature testing
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - What's implemented
- [READY_TO_TEST.md](READY_TO_TEST.md) - Testing guide

---

**Deployment Version:** 2.0.0  
**Last Updated:** 2026-05-06  
**Target Environment:** On-Premise/Offline Server
