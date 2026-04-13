from sqlalchemy import text

from app.db.base import Base
from app.db.session import engine


def _ensure_personal_number_column() -> None:
    # Add the column if it does not exist yet (for existing databases).
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'student' "
                "AND COLUMN_NAME = 'personal_number'"
            )
        )
        has_column = bool(result.scalar())
        if not has_column:
            conn.execute(
                text(
                    "ALTER TABLE student "
                    "ADD COLUMN personal_number VARCHAR(32) NULL UNIQUE"
                )
            )
            conn.commit()


def _ensure_student_relationship_columns() -> None:
    """
    Ensure relationship columns for commander / department exist on the student table
    for existing databases.
    """
    with engine.connect() as conn:
        # commander_id
        result = conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'student' "
                "AND COLUMN_NAME = 'commander_id'"
            )
        )
        has_commander_id = bool(result.scalar())
        if not has_commander_id:
            conn.execute(
                text(
                    "ALTER TABLE student "
                    "ADD COLUMN commander_id INT NULL"
                )
            )
            conn.commit()

        # department_manager_id
        result = conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'student' "
                "AND COLUMN_NAME = 'department_manager_id'"
            )
        )
        has_department_manager_id = bool(result.scalar())
        if not has_department_manager_id:
            conn.execute(
                text(
                    "ALTER TABLE student "
                    "ADD COLUMN department_manager_id INT NULL"
                )
            )
            conn.commit()

        # department_id
        result = conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'student' "
                "AND COLUMN_NAME = 'department_id'"
            )
        )
        has_department_id = bool(result.scalar())
        if not has_department_id:
            conn.execute(
                text(
                    "ALTER TABLE student "
                    "ADD COLUMN department_id INT NULL"
                )
            )
            conn.commit()


def _ensure_personal_columns() -> None:
    """Add personal-details columns to student table if missing (for existing DBs)."""
    columns = [
        ("birth_date", "ADD COLUMN birth_date DATE NULL"),
        ("parents_json", "ADD COLUMN parents_json TEXT NULL"),
        ("address_city", "ADD COLUMN address_city VARCHAR(255) NULL"),
        ("address_street", "ADD COLUMN address_street VARCHAR(255) NULL"),
        ("address_is_far", "ADD COLUMN address_is_far TINYINT(1) NULL DEFAULT 0"),
    ]
    with engine.connect() as conn:
        for col_name, alter_sql in columns:
            result = conn.execute(
                text(
                    "SELECT COUNT(*) FROM information_schema.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student' AND COLUMN_NAME = :name"
                ),
                {"name": col_name},
                )
            if not result.scalar():
                conn.execute(text(f"ALTER TABLE student {alter_sql}"))
                conn.commit()


def _migrate_student_status_to_active_terminated() -> None:
    """Migrate student status from completed/removed to terminated and ensure enum is active/terminated."""
    with engine.connect() as conn:
        r = conn.execute(
            text(
                "SELECT COLUMN_TYPE FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student' AND COLUMN_NAME = 'status'"
            )
        )
        row = r.fetchone()
        if not row:
            return
        col_type = (row[0] or "").upper()
        if "COMPLETED" in col_type or "REMOVED" in col_type:
            conn.execute(text("ALTER TABLE student MODIFY status ENUM('active','completed','removed','terminated') NOT NULL DEFAULT 'active'"))
            conn.commit()
            conn.execute(text("UPDATE student SET status = 'terminated' WHERE status IN ('completed','removed')"))
            conn.commit()
            conn.execute(text("ALTER TABLE student MODIFY status ENUM('active','terminated') NOT NULL DEFAULT 'active'"))
            conn.commit()


def init_db_and_seed() -> None:
    """Initialize database with empty schema - no seed data."""
    Base.metadata.create_all(bind=engine)
    _ensure_student_relationship_columns()
    _ensure_personal_columns()
    _migrate_student_status_to_active_terminated()
    _ensure_personal_number_column()
    # Empty database - no seed data

