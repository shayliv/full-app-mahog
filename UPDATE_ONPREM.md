# 🔄 Update On-Premise Installation

This guide shows how to update your existing on-premise ARMI system with the new features.

---

## ✅ What's New in This Update

- ✅ Rich text editor (with focus fix)
- ✅ File attachments system
- ✅ Discipline status workflow (5 stages)
- ✅ EXIT_HOURS punishment type
- ✅ Medical enhancements (grade ב׳, event time, notes)
- ✅ Command summaries with titles
- ✅ Bakatzim (leave requests) module
- ✅ All bug fixes applied

---

## 🚀 Quick Update Process

### Step 1: Build Offline Package (On This Machine)

```bash
cd /Users/shay/Projects/armi/fullapp

# Build the Docker images and save for offline transfer
./scripts/save-offline.sh
```

This creates: `offline-images/` directory with:
- `student-crm-backend.tar.gz`
- `student-crm-frontend.tar.gz`
- `mysql-8.0.tar.gz`

### Step 2: Transfer to On-Premise Server

```bash
# Option A: Using network (if available)
rsync -avz --progress /Users/shay/Projects/armi/fullapp/ user@server:/opt/armi/

# Option B: Using USB drive
# 1. Copy entire fullapp directory to USB
# 2. On server: cp -r /media/usb/fullapp /opt/armi/
```

### Step 3: On the On-Premise Server

```bash
cd /opt/armi/fullapp

# Stop current containers
docker compose down

# Load new images
./scripts/load-and-start.sh
```

**That's it!** The script will:
- Load the new Docker images
- Run database migrations automatically (on container startup)
- Start all services

---

## 🔍 Verification

After update, verify:

```bash
# Check containers are running
docker compose ps

# Should show:
# fullapp-db-1        running
# fullapp-backend-1   running
# fullapp-frontend-1  running

# Check backend logs
docker compose logs backend | tail -20

# Check if migration ran
docker compose logs backend | grep -i migration

# Access application
open http://localhost
# Or: http://server-ip
```

### Test New Features

1. **Rich Text Editor**
   - Open any student → Discipline tab
   - Click "הוסף אירוע משמעת"
   - Click in text field and type
   - ✅ Focus should stay while typing

2. **File Attachments**
   - In any event form, upload a file
   - ✅ Should upload successfully

3. **Bakatzim Tab**
   - Open student details
   - ✅ See "בקצים" tab
   - Click it → Should work

4. **Discipline Status**
   - Create discipline event
   - ✅ See status dropdown with 5 options

See [FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md) for complete testing.

---

## 📋 Manual Migration (If Needed)

If database migration doesn't run automatically:

```bash
# Enter backend container
docker compose exec backend bash

# Run migration
python migrate_db.py --dry-run  # Review
python migrate_db.py            # Apply

# Exit container
exit
```

---

## 🔧 Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker compose logs

# Common fixes:
docker compose down
docker system prune -f  # Clean old images
./scripts/load-and-start.sh
```

### Database Migration Errors

```bash
# Check database is ready
docker compose exec db mysqladmin ping -uroot -pcrm_root_pass

# If database connection fails, wait 30 seconds and restart
docker compose restart backend
```

### Frontend Shows Old Version

```bash
# Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
# Or force rebuild:
docker compose build frontend --no-cache
docker compose up -d
```

### Can't Upload Files

```bash
# Check upload directory permissions
docker compose exec backend ls -la /app/static/uploads

# Fix if needed:
docker compose exec backend mkdir -p /app/static/uploads
docker compose exec backend chmod 777 /app/static/uploads
```

---

## 🔙 Rollback (If Needed)

If something goes wrong:

```bash
# Stop current version
docker compose down

# Load previous images (if you saved them)
docker load < backup/student-crm-backend-old.tar.gz
docker load < backup/student-crm-frontend-old.tar.gz

# Start previous version
docker compose up -d
```

---

## 💾 Backup Before Update

**Recommended:** Backup before updating

```bash
# On server, before step 3:

# 1. Backup database
docker compose exec db mysqldump -uroot -pcrm_root_pass student_crm > backup-$(date +%Y%m%d).sql

# 2. Backup uploaded files
docker compose exec backend tar -czf /tmp/uploads-backup.tar.gz /app/static/uploads
docker cp fullapp-backend-1:/tmp/uploads-backup.tar.gz ./uploads-backup-$(date +%Y%m%d).tar.gz

# 3. Save current Docker images (optional)
docker save student-crm-backend:latest | gzip > backup/backend-old.tar.gz
docker save student-crm-frontend:latest | gzip > backup/frontend-old.tar.gz
```

---

## 🎯 Post-Update Tasks

After successful update:

1. **Add Missing Trainees**
   - Use the new AddTraineeModal
   - Add: Eden Dra'i (עדן דרעי)
   - Add: Shir Navon (שיר נבון)

2. **Test All Features**
   - Follow [FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md)
   - Verify rich text works
   - Test file uploads
   - Check all tabs

3. **Train Users**
   - Show new rich text editor
   - Demonstrate file attachments
   - Explain discipline status workflow
   - Introduce Bakatzim module

---

## 📊 What Changed

### Database Changes
- ✅ New tables: `attachments`, `bakatz`, `trainee_check_in`
- ✅ New columns in `disciplineevent`: `status`
- ✅ New columns in `medicalevent`: `event_time`, `educational_material_missed`, `notes`
- ✅ New columns in `medicalprofile`: `notes`
- ✅ New columns in `commandsummary`: `title`
- ✅ Updated enums: `response_type` includes `exit_hours`

### Backend Changes
- ✅ New API endpoints for attachments and bakatzim
- ✅ HTML sanitization for security
- ✅ New models and schemas

### Frontend Changes
- ✅ RichTextEditor component (new)
- ✅ FileUpload/FileList components (new)
- ✅ StudentBakatzimTab (new)
- ✅ Completely rewritten: Discipline, Medical, Summaries tabs
- ✅ Bakatzim tab added to StudentDetailsPage

---

## ⏱️ Estimated Downtime

- **Transfer files:** 5-15 minutes (depends on file size and method)
- **Load images:** 2-5 minutes
- **Database migration:** ~30 seconds
- **Container restart:** ~1 minute

**Total:** ~10-20 minutes

---

## ✅ Success Criteria

Update is successful when:

- ✅ All containers running (`docker compose ps`)
- ✅ Can access frontend at http://localhost
- ✅ Can log in
- ✅ Rich text editors work (no focus loss)
- ✅ File uploads work
- ✅ Bakatzim tab visible in student details
- ✅ No errors in logs

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker compose logs -f`
2. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Review [FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md)
4. Contact system administrator

---

**Update Version:** 2.0.0  
**Last Updated:** 2026-05-06  
**Deployment Method:** Docker Compose (Offline)
