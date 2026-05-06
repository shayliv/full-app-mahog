# 🚀 Deploy to On-Premise Server - Quick Steps

## ✅ Everything is Ready!

All features implemented, all bugs fixed. Ready to deploy to your on-premise installation.

---

## 📦 Step 1: Build Offline Package (Right Now)

```bash
cd /Users/shay/Projects/armi/fullapp
./scripts/save-offline.sh
```

**What this does:**
- Builds Docker images with all new features
- Saves them as `.tar.gz` files in `offline-images/` directory
- Takes ~5-10 minutes

**Output:** You'll get these files in `offline-images/`:
- `student-crm-backend.tar.gz` (~500MB)
- `student-crm-frontend.tar.gz` (~50MB)  
- `mysql-8.0.tar.gz` (~200MB)

---

## 📤 Step 2: Transfer to Server

### Option A: Network Transfer (if available)
```bash
# Transfer entire directory
rsync -avz --progress \
  /Users/shay/Projects/armi/fullapp/ \
  user@your-server:/opt/armi/
```

### Option B: USB Drive (fully offline)
1. Copy `/Users/shay/Projects/armi/fullapp/` to USB drive
2. On server: Copy from USB to `/opt/armi/`

---

## 🎯 Step 3: Deploy on Server

```bash
# SSH to server or use local terminal on server
ssh user@your-server

# Navigate to project
cd /opt/armi/fullapp

# Stop current version
docker compose down

# Load and start new version
./scripts/load-and-start.sh
```

**That's it!** The script automatically:
- ✅ Loads new Docker images
- ✅ Runs database migrations
- ✅ Starts all services

---

## ✅ Step 4: Verify It's Working

```bash
# Check all containers are running
docker compose ps

# Should show 3 services running:
# ✅ fullapp-db-1        (MySQL)
# ✅ fullapp-backend-1   (FastAPI)
# ✅ fullapp-frontend-1  (Nginx)

# Check backend logs
docker compose logs backend | tail -20

# Look for:
# "Application startup complete"
# "✅ Database migration completed"
```

### Test in Browser

1. Open: `http://your-server-ip/` or `http://localhost/`
2. Log in
3. **Critical Test:** Open student → Discipline tab → Click in text field and TYPE
   - ✅ Focus should stay while typing (this was the main bug)
4. Try uploading a file
   - ✅ Should work
5. Open student details
   - ✅ Should see new "בקצים" tab

---

## 🎉 Done!

If all tests pass, you're ready to use the new features!

### Next Steps:

1. **Add missing trainees:**
   - Eden Dra'i (עדן דרעי)
   - Shir Navon (שיר נבון)

2. **Full testing:**
   - See [FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md)

3. **Train users:**
   - Show rich text editor
   - Demonstrate file attachments
   - Explain Bakatzim module

---

## 🔧 Quick Troubleshooting

### Problem: Containers won't start
```bash
docker compose logs
# Look for errors, usually database connection
```

### Problem: Old version still showing
```bash
# Force browser refresh
Ctrl+Shift+R  # Windows/Linux
Cmd+Shift+R   # Mac
```

### Problem: Can't upload files
```bash
docker compose exec backend mkdir -p /app/static/uploads
docker compose exec backend chmod 777 /app/static/uploads
docker compose restart backend
```

---

## 📊 What You're Deploying

### New Features
- ✅ Rich text editor (Bold, Italic, Underline, Lists)
- ✅ File attachments (PDF, images, docs)
- ✅ Discipline status workflow (5 stages)
- ✅ EXIT_HOURS punishment type (שעות ביציאה)
- ✅ Medical enhancements (grade ב׳, event time, notes)
- ✅ Command summaries with titles
- ✅ **NEW:** Bakatzim module (leave requests)

### Bug Fixes
- ✅ Rich text editor focus loss (CRITICAL FIX)
- ✅ Discipline edit not saving
- ✅ Import path errors
- ✅ Foreign key errors

### Database Changes
- ✅ 3 new tables (attachments, bakatz, trainee_check_in)
- ✅ 11 new columns across existing tables
- ✅ All migrations run automatically on startup

---

## ⏱️ Time Estimate

- Build images: ~5-10 minutes
- Transfer: 5-30 minutes (depends on method)
- Deploy on server: ~2-5 minutes
- **Total: ~15-45 minutes**

---

## 💾 Backup (Recommended)

Before deploying, backup current database:

```bash
# On server:
docker compose exec db mysqldump -uroot -pcrm_root_pass student_crm > backup-$(date +%Y%m%d).sql
```

---

## 📞 Need Help?

- Detailed guide: [UPDATE_ONPREM.md](UPDATE_ONPREM.md)
- Docker info: [OFFLINE_DEPLOYMENT.md](OFFLINE_DEPLOYMENT.md)
- Testing: [FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md)
- Implementation details: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

---

**Ready to deploy?** → Run Step 1 now! ✨
