# ARMI Training Management System - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL/MariaDB database
- pip and npm installed

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure database connection
# Edit backend/.env or backend/app/core/config.py with your database credentials

# Run database migration
python migrate_db.py --dry-run  # First check what will change
python migrate_db.py            # Then apply changes

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📦 Production Deployment

### Backend Production

```bash
cd backend

# Install production dependencies
pip install -r requirements.txt
pip install gunicorn  # For production server

# Run migrations
python migrate_db.py

# Start with Gunicorn (production server)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Production

```bash
cd frontend

# Build for production
npm run build

# The dist/ folder contains the production build
# Serve with nginx, Apache, or any static file server
```

### Nginx Configuration Example

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔧 Configuration

### Backend Configuration

Edit `backend/app/core/config.py` or create `backend/.env`:

```env
# Database
DATABASE_URL=mysql+pymysql://user:password@localhost/armi_db

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256

# CORS (for development)
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
```

### Frontend Configuration

Edit `frontend/src/lib/api.ts` if needed:

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
});
```

---

## 🔄 Database Migration

### First Time Setup

If starting fresh:
```bash
cd backend
python reset_db.py  # Creates empty schema
```

### Applying New Features

After pulling updates with new features:
```bash
cd backend
python migrate_db.py --dry-run  # Check changes
python migrate_db.py            # Apply changes
```

The migration script safely adds:
- New columns to existing tables
- New tables (attachments, bakatz, trainee_check_in)
- New enum values
- Does NOT delete or modify existing data

---

## ✨ New Features Added

### 1. Rich Text Editor
- All text fields now support formatting: **bold**, *italic*, underline, lists
- HTML is sanitized on backend for security
- Works offline (no CDN dependencies)

### 2. File Attachments
- Upload files to discipline events, medical records, command summaries, bakatzim
- Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, WebP
- Maximum file size: 10MB
- Files stored in `backend/static/uploads/`

### 3. Discipline Status Workflow
New status tracking for discipline events:
1. נאמר (told) - Trainee told to submit report
2. הגיש/ה (submitted) - Report submitted
3. הוחלט (decided) - Punishment decided
4. נמסר (delivered) - Punishment delivered
5. בוצע (completed) - Punishment completed

### 4. New Punishment Type
- שעות ביציאה (Exit Hours) added to discipline response types

### 5. Medical Enhancements
- Event time tracking
- Educational material missed field
- Notes field for profile and events
- Medical profile grade "ב׳" added

### 6. Command Summaries
- Optional title field for summaries
- Rich text support for summary content

### 7. Bakatzim (Leave Requests)
Complete leave request management system:
- Request date, leave dates, destination
- Transportation method tracking
- Status workflow: pending → approved/denied/cancelled
- File attachments support

### 8. UI Components
- AddTraineeModal for easy trainee addition
- Improved forms with validation
- File upload/list components
- Status badges with colors

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest  # If tests exist
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing Checklist

- [ ] Login and navigation works
- [ ] Add new trainee using modal
- [ ] Create discipline event with rich text
- [ ] Upload file attachment
- [ ] Change discipline status through workflow
- [ ] Create medical event with time
- [ ] Add command summary with title
- [ ] Create bakatz (leave request)
- [ ] Filter by track in views
- [ ] All forms validate correctly

---

## 📁 Important Files

### Backend
```
backend/
├── migrate_db.py              # Database migration script
├── reset_db.py                # Reset database (dev only)
├── requirements.txt           # Python dependencies
├── app/
│   ├── main.py               # FastAPI application
│   ├── models/               # Database models
│   ├── schemas/              # Pydantic schemas
│   ├── api/v1/endpoints/     # API endpoints
│   └── utils/
│       └── text_sanitizer.py # HTML sanitization
└── static/uploads/           # Uploaded files (created automatically)
```

### Frontend
```
frontend/
├── package.json              # Node dependencies
├── src/
│   ├── components/
│   │   ├── RichTextEditor.tsx      # Rich text component
│   │   ├── FileUpload.tsx          # File upload component
│   │   ├── FileList.tsx            # File list component
│   │   ├── AddTraineeModal.tsx     # Add trainee modal
│   │   ├── StudentDisciplineTab.tsx
│   │   ├── StudentMedicalTab.tsx
│   │   ├── StudentSummariesTab.tsx
│   │   └── StudentBakatzimTab.tsx
│   ├── pages/
│   └── lib/
│       └── api.ts            # API client configuration
└── dist/                     # Production build (after npm run build)
```

---

## 🔐 Security Notes

1. **HTML Sanitization**: All rich text is sanitized using bleach library
2. **File Upload Validation**: File types and sizes are validated
3. **SQL Injection Protection**: Using SQLAlchemy ORM with parameterized queries
4. **CORS**: Configure appropriately for production
5. **Authentication**: Ensure proper authentication is configured (if not already)

---

## 🐛 Troubleshooting

### Database Connection Error
```
Check DATABASE_URL in backend/.env or config.py
Verify MySQL service is running: systemctl status mysql
Test connection: mysql -u user -p database_name
```

### Migration Fails
```bash
# Check what the migration would do
python migrate_db.py --dry-run

# Check database permissions
# Ensure user has ALTER, CREATE, INSERT permissions
```

### Frontend Can't Connect to Backend
```
Check CORS settings in backend
Verify API URL in frontend/src/lib/api.ts
Check backend is running on correct port
```

### File Uploads Not Working
```
# Ensure upload directory exists and is writable
mkdir -p backend/static/uploads
chmod 755 backend/static/uploads

# Check max file size in nginx (if using)
client_max_body_size 10M;
```

### Rich Text Not Displaying
```
# Verify bleach is installed
pip list | grep bleach

# Check browser console for errors
# Ensure RichTextEditor.css is loaded
```

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review IMPLEMENTATION_SUMMARY.md
3. Check backend logs: `backend/logs/` (if logging configured)
4. Check browser console for frontend errors
5. Review migration script output: `python migrate_db.py --dry-run`

---

## 🔄 Updating the System

### After Git Pull

```bash
# 1. Update backend dependencies
cd backend
pip install -r requirements.txt

# 2. Run migrations
python migrate_db.py

# 3. Restart backend
# (Stop current server with Ctrl+C, then restart)

# 4. Update frontend dependencies (if package.json changed)
cd ../frontend
npm install

# 5. Rebuild frontend (production only)
npm run build
```

---

## 📊 Database Backup

### Backup
```bash
mysqldump -u user -p armi_db > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
mysql -u user -p armi_db < backup_20260506.sql
```

**⚠️ Always backup before running migrations in production!**

---

## 🎯 Next Steps After Deployment

1. ✅ Run database migration
2. ✅ Test all new features
3. ✅ Add the two missing trainees (Eden Dra'i, Shir Navon)
4. ✅ Train users on new features:
   - Rich text formatting
   - File attachments
   - Discipline status workflow
   - Bakatzim system
5. ✅ Monitor system performance
6. ✅ Regular database backups

---

## 📝 Version Information

**Version**: 2.0.0  
**Release Date**: 2026-05-06  
**Database Version**: Requires migration from v1.x

**Major Changes**:
- Rich text editor integration
- File attachments system
- Enhanced discipline workflow
- New bakatzim module
- Medical system improvements
- Command summary enhancements

---

## 🎉 Success!

If everything is working:
- ✅ Backend running on port 8000
- ✅ Frontend accessible
- ✅ Database migrations applied
- ✅ File uploads working
- ✅ Rich text formatting works
- ✅ All tabs and features accessible

**Ready to use!** 🚀
