# Hotfix: Foreign Key Table Name

## Issue
Migration failed with error:
```
Foreign key associated with column 'attachments.uploaded_by_id' could not find table 'users' with which to generate a foreign key to target column 'id'
```

## Root Cause
The User model uses automatic table naming from Base class, which converts class name to lowercase: `User` → `user` (not `users`)

## Fix Applied
Updated foreign key references from `users.id` to `user.id` in:

1. **backend/app/models/attachment.py**
   - Line 17: `ForeignKey("users.id")` → `ForeignKey("user.id")` ✅

2. **backend/app/models/check_in.py**
   - Line 17: `ForeignKey("users.id")` → `ForeignKey("user.id")` ✅

## How to Apply
These changes are already in the files. Simply run the migration again:

```bash
cd backend
python migrate_db.py --dry-run  # Check it will work
python migrate_db.py            # Apply changes
```

## Status
✅ **FIXED** - Migration should now work correctly.

The table name is `user` (singular) not `users` (plural) because of the automatic naming convention in `app/db/base.py`:
```python
@declared_attr
def __tablename__(cls) -> str:
    return cls.__name__.lower()  # "User" → "user"
```
