# 🚀 ARMI System - Quick Start Guide

## ✅ All Hotfixes Applied - Ready to Run!

### Issues Fixed:
1. ✅ Foreign key table name corrected (`users` → `user`)
2. ✅ Import paths corrected (`../api` → `../lib/api`)
3. ✅ Package name typo fixed (`@tantml` → `@tanstack`)
4. ✅ Rich text editor focus loss fixed (lastValueRef pattern)

---

## 📦 Installation (First Time Only)

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate  # Mac/Linux
# OR
.venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install
```

---

## 🔄 Database Migration

```bash
cd backend

# Activate virtual environment (if not already active)
source .venv/bin/activate

# Check what will change (dry run)
python migrate_db.py --dry-run

# Apply the migration
python migrate_db.py
```

**Expected Output:**
```
✓ Successfully applied X change(s)
✅ Database migration completed successfully!
```

---

## ▶️ Start the Application

### Terminal 1 - Backend:
```bash
cd backend
source .venv/bin/activate  # Activate venv
uvicorn app.main:app --reload --port 8000
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

---

## 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## ✨ New Features to Test

### 1. Rich Text Formatting
- Go to any text field (discipline, medical, summaries)
- Use the toolbar: **Bold**, *Italic*, Underline, Lists
- Save and verify formatting persists

### 2. File Attachments
- Create/edit a discipline event, medical record, or summary
- Click "Upload File" button
- Upload a PDF, image, or document
- Download and delete files

### 3. Add Trainees
- Go to Students List page
- Click "+ הוסף חניך" button
- Fill in trainee details
- **Add Eden Dra'i (עדן דרעי)**
- **Add Shir Navon (שיר נבון)**

### 4. Discipline Status Workflow
- Create a discipline event
- Set status: נאמר → הגיש/ה → הוחלט → נמסר → בוצע
- Try "שעות ביציאה" (Exit Hours) punishment type

### 5. Medical Enhancements
- Go to Medical tab
- Add medical profile with grade "ב׳"
- Create medical event with:
  - Event time
  - Educational material missed
  - Notes (with rich text)

### 6. Command Summaries
- Go to Summaries tab
- Add a summary with a title
- Use rich text for content
- Edit and delete summaries

### 7. Bakatzim (Leave Requests)
- Go to student details
- Click "Bakatzim" tab (if added to UI)
- Create leave request with:
  - Request date
  - Leave dates
  - Destination
  - Transportation method
  - Notes

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Make sure virtual environment is activated
source .venv/bin/activate

# Check if port 8000 is already in use
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process if needed
kill -9 <PID>  # Mac/Linux
```

### Frontend won't start
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try different port if 5173 is taken
npm run dev -- --port 5174
```

### Migration fails
```bash
# Check database connection
# Make sure MySQL/MariaDB is running
systemctl status mysql  # Linux
brew services list  # Mac

# Check database credentials in backend/app/core/config.py
```

### Import errors in frontend
All import paths have been fixed. If you still see errors:
```bash
cd frontend
rm -rf node_modules .vite
npm install
npm run dev
```

---

## 📝 Quick Reference

### Backend Commands
```bash
cd backend
source .venv/bin/activate
python migrate_db.py          # Run migration
uvicorn app.main:app --reload # Start server
pytest                        # Run tests (if any)
```

### Frontend Commands
```bash
cd frontend
npm install           # Install dependencies
npm run dev           # Development server
npm run build         # Production build
npm run preview       # Preview production build
```

---

## ✅ Verification Checklist

After starting the application, verify:

- [ ] Backend running on http://localhost:8000
- [ ] Frontend accessible at http://localhost:5173
- [ ] Can log in and see dashboard
- [ ] Can navigate to Students List
- [ ] "Add Trainee" button visible
- [ ] Can create discipline event with rich text
- [ ] File upload works
- [ ] All tabs in student details work
- [ ] No console errors in browser

---

## 🎯 Next Steps

1. **Add Missing Trainees**
   - Use the Add Trainee modal
   - Add Eden Dra'i (עדן דרעי)
   - Add Shir Navon (שיר נבון)

2. **Test All Features**
   - Rich text in all text fields
   - File attachments
   - Discipline status workflow
   - Medical enhancements
   - Command summaries with titles
   - Bakatzim (leave requests)

3. **Train Users**
   - Show new features to commanders
   - Demonstrate rich text editor
   - Explain discipline status workflow
   - Show file attachment feature

---

## 📚 Documentation

- **Complete Features**: See `COMPLETION_STATUS.md`
- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **Technical Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Hotfixes Applied**: See `HOTFIX_*.md` files

---

## 🆘 Need Help?

1. Check error messages in terminal
2. Check browser console (F12)
3. Review the troubleshooting section above
4. Check the documentation files
5. Verify all hotfixes were applied

---

## 🎉 Success!

When everything works:
- ✅ Both servers running
- ✅ No errors in terminal or browser
- ✅ Can navigate and use all features
- ✅ Rich text works
- ✅ File uploads work
- ✅ All forms save correctly

**You're ready to go!** 🚀

---

**System Version**: 2.0.0  
**Last Updated**: 2026-05-06  
**Status**: ✅ All hotfixes applied, ready for production
