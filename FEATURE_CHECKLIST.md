# ✅ ARMI System Features - Implementation Checklist

## 📝 How to Use This Checklist
Go through each item and check it off after testing. Mark with ✅ when working, ❌ if broken.

---

## 🎨 1. Rich Text Editor

### Testing Rich Text in Discipline Tab
- [ ] Open any student → Discipline tab
- [ ] Click "הוסף אירוע משמעת"
- [ ] Click in "תיאור האירוע" field
- [ ] **Test:** Click and start typing - does focus stay? ✅ / ❌
- [ ] **Test:** Type several words without losing focus ✅ / ❌
- [ ] Select text and click **B** (Bold) - does it bold? ✅ / ❌
- [ ] Select text and click **I** (Italic) - does it italicize? ✅ / ❌
- [ ] Select text and click **U** (Underline) - does it underline? ✅ / ❌
- [ ] Click bullet list button - does it create list? ✅ / ❌
- [ ] Click numbered list button - does it create numbered list? ✅ / ❌
- [ ] Save event and refresh page - does formatting persist? ✅ / ❌
- [ ] Same test for "הערות" field ✅ / ❌

### Testing Rich Text in Medical Tab
- [ ] Open student → Medical tab
- [ ] Add medical event
- [ ] Test "חומר לימוד שפספסו" field with rich text ✅ / ❌
- [ ] Test "הערות" field in event form ✅ / ❌
- [ ] Edit medical profile
- [ ] Test "הערות" field in profile ✅ / ❌
- [ ] Verify formatting persists after save ✅ / ❌

### Testing Rich Text in Summaries Tab
- [ ] Open student → Summaries tab
- [ ] Click "הוסף סיכום"
- [ ] Test rich text in "תוכן הסיכום" field ✅ / ❌
- [ ] Save and verify formatting persists ✅ / ❌

### Testing Rich Text in Bakatzim Tab
- [ ] Open student → בקצים tab
- [ ] Click "הוסף בקשת יציאה"
- [ ] Test rich text in "הערות" field ✅ / ❌
- [ ] Save and verify formatting persists ✅ / ❌

---

## 📎 2. File Attachments

### Testing File Upload in Discipline
- [ ] Create or edit discipline event
- [ ] See "מסמכים מצורפים" section ✅ / ❌
- [ ] Click "בחר קובץ" or upload button ✅ / ❌
- [ ] Upload PDF file (< 10MB) ✅ / ❌
- [ ] Upload image (JPG/PNG) ✅ / ❌
- [ ] **Test:** Try uploading 11MB file - should reject ✅ / ❌
- [ ] **Test:** Try uploading .exe file - should reject ✅ / ❌
- [ ] See uploaded file in list ✅ / ❌
- [ ] Click file name to download ✅ / ❌
- [ ] Verify downloaded file opens correctly ✅ / ❌
- [ ] Click delete (trash icon) ✅ / ❌
- [ ] Confirm file removed from list ✅ / ❌

### Testing File Upload in Medical
- [ ] Edit medical event
- [ ] Upload medical document ✅ / ❌
- [ ] Download and verify ✅ / ❌
- [ ] Delete attachment ✅ / ❌

### Testing File Upload in Summaries
- [ ] Edit command summary
- [ ] Upload supporting document ✅ / ❌
- [ ] Download and verify ✅ / ❌
- [ ] Delete attachment ✅ / ❌

### Testing File Upload in Bakatzim
- [ ] Edit bakatz (leave request)
- [ ] Upload travel document ✅ / ❌
- [ ] Download and verify ✅ / ❌
- [ ] Delete attachment ✅ / ❌

---

## 🚨 3. Discipline System Enhancements

### Testing Status Workflow
- [ ] Create new discipline event
- [ ] See status dropdown with 5 options ✅ / ❌
  - [ ] נאמר (told)
  - [ ] הגיש/ה (submitted)
  - [ ] הוחלט (decided)
  - [ ] נמסר (delivered)
  - [ ] בוצע (completed)
- [ ] Set status to "נאמר" and save ✅ / ❌
- [ ] Edit event, change to "הגיש/ה" ✅ / ❌
- [ ] Continue through workflow to "בוצע" ✅ / ❌
- [ ] View in discipline table - status badge shows? ✅ / ❌
- [ ] Status badge has correct color? ✅ / ❌

### Testing EXIT_HOURS Punishment Type
- [ ] Create discipline event
- [ ] Open "סוג תגובה" dropdown ✅ / ❌
- [ ] See "שעות ביציאה" option ✅ / ❌
- [ ] Select it and save ✅ / ❌
- [ ] Edit event - correct type selected? ✅ / ❌

### Testing Discipline Edit Fix
- [ ] Create discipline event with description and remarks
- [ ] Save it
- [ ] Click "ערוך" button ✅ / ❌
- [ ] Change description text ✅ / ❌
- [ ] Change remarks text ✅ / ❌
- [ ] Click "עדכן" ✅ / ❌
- [ ] **CRITICAL:** Verify changes actually saved ✅ / ❌
- [ ] Refresh page - changes still there? ✅ / ❌

---

## 🏥 4. Medical System Enhancements

### Testing Medical Profile Grade "ב׳"
- [ ] Open student → Medical tab
- [ ] Edit or create medical profile
- [ ] Open "פרופיל רפואי" dropdown ✅ / ❌
- [ ] See option "ב׳" ✅ / ❌
- [ ] Select it and save ✅ / ❌
- [ ] Verify it displays correctly ✅ / ❌

### Testing Event Time
- [ ] Add medical event
- [ ] See "שעת האירוע" field with time picker ✅ / ❌
- [ ] Set time (e.g., 14:30) ✅ / ❌
- [ ] Save and verify time displays ✅ / ❌

### Testing Educational Material Missed
- [ ] Add medical event
- [ ] See "חומר לימוד שפספסו" field ✅ / ❌
- [ ] Enter text with rich formatting ✅ / ❌
- [ ] Save and verify ✅ / ❌

### Testing Medical Notes (Profile)
- [ ] Edit medical profile
- [ ] See "הערות" field with rich text editor ✅ / ❌
- [ ] Add notes with formatting ✅ / ❌
- [ ] Save and verify notes persist ✅ / ❌

### Testing Medical Notes (Events)
- [ ] Add medical event
- [ ] See "הערות" field with rich text ✅ / ❌
- [ ] Add notes with formatting ✅ / ❌
- [ ] Save and verify ✅ / ❌

### Testing Medical Event Edit
- [ ] Create medical event
- [ ] Click "ערוך" button ✅ / ❌
- [ ] Modify fields ✅ / ❌
- [ ] Save changes ✅ / ❌
- [ ] Verify changes persist ✅ / ❌

---

## 📋 5. Command Summaries Enhancement

### Testing Title Field
- [ ] Open student → Summaries tab
- [ ] Click "הוסף סיכום"
- [ ] See "כותרת" field (optional) ✅ / ❌
- [ ] Enter title: "סיכום חודש מרץ" ✅ / ❌
- [ ] Enter summary text with rich formatting ✅ / ❌
- [ ] Save ✅ / ❌
- [ ] Verify title appears in card header ✅ / ❌
- [ ] Create summary WITHOUT title ✅ / ❌
- [ ] Verify it works (title is optional) ✅ / ❌

### Testing Summary Edit
- [ ] Click "ערוך" on existing summary ✅ / ❌
- [ ] Change title ✅ / ❌
- [ ] Change text with rich formatting ✅ / ❌
- [ ] Save and verify ✅ / ❌

### Testing Summary Delete
- [ ] Click "מחק" on a summary ✅ / ❌
- [ ] Confirm deletion ✅ / ❌
- [ ] Verify summary removed ✅ / ❌

---

## 🚪 6. Bakatzim (Leave Requests) Module

### Testing Bakatzim Tab
- [ ] Open any student details page
- [ ] See "בקצים" tab ✅ / ❌
- [ ] Click the tab ✅ / ❌
- [ ] Tab opens successfully ✅ / ❌

### Testing Create Bakatz
- [ ] Click "הוסף בקשת יציאה (בקשצ)" ✅ / ❌
- [ ] Form opens with all fields:
  - [ ] תאריך הגשת הבקשצ (request date)
  - [ ] תאריך יציאה (leave start)
  - [ ] תאריך חזרה (return date)
  - [ ] סטטוס (status dropdown)
  - [ ] מיקום הבקשצ (destination)
  - [ ] דרך הגעה (transportation method)
  - [ ] הערות (notes with rich text)
- [ ] Fill all required fields ✅ / ❌
- [ ] Add notes with rich formatting ✅ / ❌
- [ ] Set status to "ממתין" ✅ / ❌
- [ ] Click "הוסף" ✅ / ❌
- [ ] Verify bakatz appears in table ✅ / ❌

### Testing Bakatz Status Workflow
- [ ] See status badge with color ✅ / ❌
- [ ] Edit bakatz ✅ / ❌
- [ ] Change status to "אושר" (approved) ✅ / ❌
- [ ] Save and verify status badge changes ✅ / ❌
- [ ] Test all statuses:
  - [ ] ממתין (pending) - yellow
  - [ ] אושר (approved) - green
  - [ ] נדחה (denied) - red
  - [ ] בוטל (cancelled) - gray

### Testing Bakatz Edit
- [ ] Click "ערוך" on bakatz ✅ / ❌
- [ ] Change dates ✅ / ❌
- [ ] Change destination ✅ / ❌
- [ ] Modify notes ✅ / ❌
- [ ] See existing attachments ✅ / ❌
- [ ] Upload new attachment ✅ / ❌
- [ ] Save changes ✅ / ❌
- [ ] Verify all changes persist ✅ / ❌

### Testing Bakatz Delete
- [ ] Click "מחק" on bakatz ✅ / ❌
- [ ] Confirm deletion ✅ / ❌
- [ ] Verify bakatz removed from table ✅ / ❌

---

## 👤 7. Trainee Management

### Testing Add Trainee Modal
- [ ] Go to Students List page
- [ ] Find "הוסף חניך" button ✅ / ❌
  - **Note:** Button may not be added yet - this is optional feature
  - If not present, test the modal component directly

### If AddTraineeModal exists:
- [ ] Click "הוסף חניך" ✅ / ❌
- [ ] Modal opens ✅ / ❌
- [ ] See all form sections:
  - [ ] Personal info (name, ID, birth date)
  - [ ] Course info (course, track, class, commander)
  - [ ] Address (city, street, distance)
  - [ ] Parents (name, phone - multiple entries)
- [ ] Fill required fields ✅ / ❌
- [ ] Submit form ✅ / ❌
- [ ] Verify trainee appears in list ✅ / ❌

### Add Missing Trainees
Using the modal or direct API:
- [ ] Add Eden Dra'i (עדן דרעי)
  - [ ] Full name entered correctly
  - [ ] Assign to appropriate track/class
  - [ ] Save successfully
- [ ] Add Shir Navon (שיר נבון)
  - [ ] Full name entered correctly
  - [ ] Assign to appropriate track/class
  - [ ] Save successfully
- [ ] Search for both trainees in list ✅ / ❌
- [ ] Open their detail pages ✅ / ❌
- [ ] Verify all data correct ✅ / ❌

---

## 🗃️ 8. Database Migration

### Before Migration
- [ ] Backend virtual environment activated
- [ ] Navigate to backend directory
- [ ] Run: `python migrate_db.py --dry-run`
- [ ] Review output - any errors? ✅ / ❌
- [ ] Review what will change ✅ / ❌

### Running Migration
- [ ] Run: `python migrate_db.py`
- [ ] Migration completes successfully? ✅ / ❌
- [ ] No error messages? ✅ / ❌
- [ ] See success message with count of changes ✅ / ❌

### After Migration
- [ ] Start backend server: `uvicorn app.main:app --reload`
- [ ] Server starts without errors? ✅ / ❌
- [ ] Check API docs: http://localhost:8000/docs ✅ / ❌
- [ ] See new endpoints:
  - [ ] `/attachments/{entity_type}/{entity_id}` (POST, GET)
  - [ ] `/attachments/{attachment_id}/download` (GET)
  - [ ] `/students/{student_id}/bakatzim` (POST, GET)
  - [ ] `/students/{student_id}/bakatzim/{bakatz_id}` (PUT, DELETE)

---

## 🐛 9. Bug Fixes Verification

### Foreign Key Fix
- [ ] Migration ran without foreign key errors ✅ / ❌
- [ ] No errors about table 'users' not found ✅ / ❌

### Import Path Fix
- [ ] Frontend compiles without errors ✅ / ❌
- [ ] No "Failed to resolve import '../api'" errors ✅ / ❌
- [ ] FileUpload component works ✅ / ❌
- [ ] FileList component works ✅ / ❌

### Package Typo Fix
- [ ] No errors about '@tantml:react-query' ✅ / ❌
- [ ] Bakatzim tab loads without errors ✅ / ❌

### Rich Text Focus Fix
- [ ] Click in any rich text field ✅ / ❌
- [ ] Start typing immediately ✅ / ❌
- [ ] **CRITICAL TEST:** Focus stays while typing? ✅ / ❌
- [ ] Can type multiple sentences without clicking again? ✅ / ❌
- [ ] Formatting buttons work? ✅ / ❌
- [ ] Cursor position maintained? ✅ / ❌

---

## 🚀 10. End-to-End Testing

### Complete User Flow
- [ ] **Step 1:** Create new trainee (Eden or Shir)
- [ ] **Step 2:** Add medical profile with grade "ב׳" and notes
- [ ] **Step 3:** Create medical event with:
  - [ ] Event time
  - [ ] Educational material missed (rich text)
  - [ ] Notes (rich text)
  - [ ] File attachment
- [ ] **Step 4:** Create discipline event with:
  - [ ] Rich text description
  - [ ] Status "נאמר"
  - [ ] Response type "שעות ביציאה"
  - [ ] Rich text remarks
  - [ ] File attachment
- [ ] **Step 5:** Progress discipline through workflow:
  - [ ] Edit: change status to "הגיש/ה"
  - [ ] Edit: change status to "הוחלט"
  - [ ] Edit: change status to "נמסר"
  - [ ] Edit: change status to "בוצע"
- [ ] **Step 6:** Add command summary with:
  - [ ] Title
  - [ ] Rich text content
  - [ ] File attachment
- [ ] **Step 7:** Create bakatz (leave request) with:
  - [ ] All dates
  - [ ] Destination and transportation
  - [ ] Rich text notes
  - [ ] File attachment
  - [ ] Status workflow (pending → approved)
- [ ] **Step 8:** Edit each item created above
- [ ] **Step 9:** Verify all data persists after refresh
- [ ] **Step 10:** Download all attachments and verify

---

## 📊 Summary

### Total Features to Test
- Rich Text: 4 modules × 2-3 fields = ~10 tests
- File Attachments: 4 modules × 4 operations = ~16 tests
- Discipline: Status (5 stages) + EXIT_HOURS + Edit fix = ~8 tests
- Medical: Grade + Time + 3 notes fields + Edit = ~6 tests
- Summaries: Title + Edit + Delete = ~4 tests
- Bakatzim: Tab + CRUD + Status + Attachments = ~12 tests
- Trainees: Add modal + 2 specific trainees = ~5 tests
- Database: Migration + Verification = ~5 tests
- Bug Fixes: 4 critical fixes = ~8 tests

**Total Test Cases: ~74**

---

## ✅ Sign-off

After completing all tests:

- [ ] All rich text editors work without focus loss
- [ ] All file uploads/downloads work
- [ ] All status workflows function correctly
- [ ] All new fields save and display properly
- [ ] All edit functionality works
- [ ] Database migration successful
- [ ] No console errors in browser
- [ ] No errors in backend logs
- [ ] Added Eden Dra'i and Shir Navon successfully
- [ ] System ready for production use

**Tester Name:** ___________________
**Date:** ___________________
**Signature:** ___________________

---

## 🆘 If Something Fails

1. **Check browser console** (F12) for errors
2. **Check backend terminal** for error messages
3. **Verify migration ran successfully**
4. **Check file paths** are correct
5. **Clear browser cache** and reload
6. **Restart backend and frontend** servers
7. **Review HOTFIX_*.md files** for known issues

**Report issues with:**
- What you were testing
- Exact error message
- Browser console output
- Backend terminal output
