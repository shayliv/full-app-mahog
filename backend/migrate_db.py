#!/usr/bin/env python3
"""
Database migration script for adding new features.
This script safely adds new columns and tables without breaking existing data.

Run this script after updating the codebase to apply database schema changes.

Usage:
    python migrate_db.py [--dry-run]

Options:
    --dry-run    Show what would be changed without actually applying changes
"""

import sys
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base

# Import all models to register them with SQLAlchemy
from app.models import (
    Student, DisciplineEvent, MedicalProfile, MedicalEvent,
    CommandSummary, Attachment, Bakatz, TraineeCheckIn
)


def print_header(message):
    """Print a formatted header."""
    print("\n" + "=" * 70)
    print(f"  {message}")
    print("=" * 70)


def check_column_exists(conn, table_name, column_name):
    """Check if a column exists in a table."""
    result = conn.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() "
            f"AND TABLE_NAME = '{table_name}' "
            f"AND COLUMN_NAME = '{column_name}'"
        )
    )
    return bool(result.scalar())


def check_table_exists(conn, table_name):
    """Check if a table exists."""
    result = conn.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.TABLES "
            "WHERE TABLE_SCHEMA = DATABASE() "
            f"AND TABLE_NAME = '{table_name}'"
        )
    )
    return bool(result.scalar())


def migrate_discipline_event(conn, dry_run=False):
    """Add status column and update response_type enum for discipline events."""
    print_header("Migrating DisciplineEvent Table")

    changes = []

    # Check if status column exists
    if not check_column_exists(conn, 'disciplineevent', 'status'):
        sql = (
            "ALTER TABLE disciplineevent "
            "ADD COLUMN status ENUM('told', 'submitted', 'decided', 'delivered', 'completed') "
            "NOT NULL DEFAULT 'told'"
        )
        changes.append(("Add status column", sql))
    else:
        print("✓ status column already exists")

    # Check if EXIT_HOURS is in response_type enum
    result = conn.execute(
        text(
            "SELECT COLUMN_TYPE FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() "
            "AND TABLE_NAME = 'disciplineevent' "
            "AND COLUMN_NAME = 'response_type'"
        )
    )
    row = result.fetchone()
    if row:
        col_type = (row[0] or "").upper()
        if "EXIT_HOURS" not in col_type:
            sql = (
                "ALTER TABLE disciplineevent MODIFY response_type "
                "ENUM('shabbat', 'hearing', 'trial', 'uniform_inspection', "
                "'cleanliness_inspection', 'reprimand_talk', 'four_corners', "
                "'exit_hours', 'other') NULL"
            )
            changes.append(("Add EXIT_HOURS to response_type enum", sql))
        else:
            print("✓ EXIT_HOURS already in response_type enum")

    # Apply changes
    if changes:
        for description, sql in changes:
            print(f"\n{'[DRY RUN] ' if dry_run else ''}Applying: {description}")
            print(f"  SQL: {sql[:100]}...")
            if not dry_run:
                conn.execute(text(sql))
                conn.commit()
                print("  ✓ Done")
    else:
        print("\n✓ No changes needed for DisciplineEvent")

    return len(changes)


def migrate_medical_event(conn, dry_run=False):
    """Add new columns to medical_event table."""
    print_header("Migrating MedicalEvent Table")

    changes = []
    columns_to_add = [
        ("event_time", "TIME NULL", "Time of the medical event"),
        ("educational_material_missed", "TEXT NULL", "Educational content missed due to medical event"),
        ("notes", "TEXT NULL", "Additional notes with rich text support"),
    ]

    for col_name, col_def, description in columns_to_add:
        if not check_column_exists(conn, 'medicalevent', col_name):
            sql = f"ALTER TABLE medicalevent ADD COLUMN {col_name} {col_def}"
            changes.append((f"Add {col_name} column - {description}", sql))
        else:
            print(f"✓ {col_name} column already exists")

    # Apply changes
    if changes:
        for description, sql in changes:
            print(f"\n{'[DRY RUN] ' if dry_run else ''}Applying: {description}")
            print(f"  SQL: {sql}")
            if not dry_run:
                conn.execute(text(sql))
                conn.commit()
                print("  ✓ Done")
    else:
        print("\n✓ No changes needed for MedicalEvent")

    return len(changes)


def migrate_medical_profile(conn, dry_run=False):
    """Add notes column to medical_profile table."""
    print_header("Migrating MedicalProfile Table")

    if not check_column_exists(conn, 'medicalprofile', 'notes'):
        sql = "ALTER TABLE medicalprofile ADD COLUMN notes TEXT NULL"
        print(f"\n{'[DRY RUN] ' if dry_run else ''}Applying: Add notes column for additional medical information")
        print(f"  SQL: {sql}")
        if not dry_run:
            conn.execute(text(sql))
            conn.commit()
            print("  ✓ Done")
        return 1
    else:
        print("✓ notes column already exists")
        return 0


def migrate_command_summary(conn, dry_run=False):
    """Add title column to command_summary table."""
    print_header("Migrating CommandSummary Table")

    if not check_column_exists(conn, 'commandsummary', 'title'):
        sql = "ALTER TABLE commandsummary ADD COLUMN title VARCHAR(255) NULL"
        print(f"\n{'[DRY RUN] ' if dry_run else ''}Applying: Add title column for summary headers")
        print(f"  SQL: {sql}")
        if not dry_run:
            conn.execute(text(sql))
            conn.commit()
            print("  ✓ Done")
        return 1
    else:
        print("✓ title column already exists")
        return 0


def create_new_tables(conn, dry_run=False):
    """Create new tables: attachments, bakatz, trainee_check_in."""
    print_header("Creating New Tables")

    tables_to_create = []

    # Check attachments table
    if not check_table_exists(conn, 'attachments'):
        tables_to_create.append('attachments')
        print("• attachments table needs to be created")
    else:
        print("✓ attachments table already exists")

    # Check bakatz table
    if not check_table_exists(conn, 'bakatz'):
        tables_to_create.append('bakatz')
        print("• bakatz table needs to be created")
    else:
        print("✓ bakatz table already exists")

    # Check trainee_check_in table
    if not check_table_exists(conn, 'trainee_check_in'):
        tables_to_create.append('trainee_check_in')
        print("• trainee_check_in table needs to be created")
    else:
        print("✓ trainee_check_in table already exists")

    if tables_to_create:
        if dry_run:
            print(f"\n[DRY RUN] Would create tables: {', '.join(tables_to_create)}")
        else:
            print(f"\nCreating tables: {', '.join(tables_to_create)}")
            # Use SQLAlchemy to create only the new tables
            Base.metadata.create_all(bind=engine, checkfirst=True)
            print("  ✓ Done")
        return len(tables_to_create)
    else:
        print("\n✓ All tables already exist")
        return 0


def run_migration(dry_run=False):
    """Run the complete migration."""
    print("\n" + "█" * 70)
    print("  DATABASE MIGRATION SCRIPT")
    print("  ARMI Training Management System")
    print("█" * 70)

    if dry_run:
        print("\n⚠️  DRY RUN MODE - No changes will be applied")
    else:
        print("\n⚠️  LIVE MODE - Changes will be applied to the database")
        response = input("\nContinue? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            print("Migration cancelled.")
            return

    total_changes = 0

    try:
        with engine.connect() as conn:
            # Run all migrations
            total_changes += migrate_discipline_event(conn, dry_run)
            total_changes += migrate_medical_event(conn, dry_run)
            total_changes += migrate_medical_profile(conn, dry_run)
            total_changes += migrate_command_summary(conn, dry_run)
            total_changes += create_new_tables(conn, dry_run)

            print_header("Migration Summary")
            if dry_run:
                print(f"\n[DRY RUN] Would apply {total_changes} change(s)")
                print("\nTo apply these changes, run without --dry-run flag:")
                print("  python migrate_db.py")
            else:
                print(f"\n✓ Successfully applied {total_changes} change(s)")
                print("\n✅ Database migration completed successfully!")
                print("\nNew features available:")
                print("  • Rich text support for all text fields")
                print("  • File attachments system")
                print("  • Discipline event status workflow (נאמר → הגיש → הוחלט → נמסר → בוצע)")
                print("  • Exit hours punishment type (שעות ביציאה)")
                print("  • Medical event time and educational material tracking")
                print("  • Medical profile and event notes")
                print("  • Command summary titles")
                print("  • Bakatzim (leave requests) system")
                print("  • Trainee check-in/attendance tracking")

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        print("\nPlease check the error message and try again.")
        sys.exit(1)


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    run_migration(dry_run)
