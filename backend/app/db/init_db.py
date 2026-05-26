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


def _ensure_discipline_status_column() -> None:
    """Add status column to discipline_event table if missing."""
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'disciplineevent' "
                "AND COLUMN_NAME = 'status'"
            )
        )
        has_column = bool(result.scalar())
        if not has_column:
            conn.execute(
                text(
                    "ALTER TABLE disciplineevent "
                    "ADD COLUMN status ENUM('TOLD', 'SUBMITTED', 'DECIDED', 'DELIVERED', 'COMPLETED') "
                    "NOT NULL DEFAULT 'TOLD' AFTER response_other_text"
                )
            )
            conn.commit()


def _ensure_medical_event_columns() -> None:
    """Add new columns to medical_event table if missing."""
    columns = [
        ("event_time", "ADD COLUMN event_time TIME NULL AFTER end_date"),
        ("educational_material_missed", "ADD COLUMN educational_material_missed TEXT NULL AFTER document_path"),
        ("notes", "ADD COLUMN notes TEXT NULL AFTER educational_material_missed"),
    ]
    with engine.connect() as conn:
        for col_name, alter_sql in columns:
            result = conn.execute(
                text(
                    "SELECT COUNT(*) FROM information_schema.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medicalevent' AND COLUMN_NAME = :name"
                ),
                {"name": col_name},
            )
            if not result.scalar():
                conn.execute(text(f"ALTER TABLE medicalevent {alter_sql}"))
                conn.commit()


def _ensure_medical_profile_notes() -> None:
    """Add notes column to medical_profile table if missing."""
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'medicalprofile' "
                "AND COLUMN_NAME = 'notes'"
            )
        )
        has_column = bool(result.scalar())
        if not has_column:
            conn.execute(
                text(
                    "ALTER TABLE medicalprofile "
                    "ADD COLUMN notes TEXT NULL AFTER diet"
                )
            )
            conn.commit()


def _ensure_command_summary_title() -> None:
    """Add title column to command_summary table if missing."""
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'commandsummary' "
                "AND COLUMN_NAME = 'title'"
            )
        )
        has_column = bool(result.scalar())
        if not has_column:
            conn.execute(
                text(
                    "ALTER TABLE commandsummary "
                    "ADD COLUMN title VARCHAR(255) NULL AFTER date"
                )
            )
            conn.commit()


def _ensure_profile_image_column() -> None:
    """Add profile_image column to student table if missing."""
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "AND TABLE_NAME = 'student' "
                "AND COLUMN_NAME = 'profile_image'"
            )
        )
        has_column = bool(result.scalar())
        if not has_column:
            conn.execute(
                text(
                    "ALTER TABLE student "
                    "ADD COLUMN profile_image VARCHAR(255) NULL"
                )
            )
            conn.commit()


def _update_discipline_response_type_enum() -> None:
    """Update discipline response type enum to include exit_hours."""
    with engine.connect() as conn:
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
                conn.execute(
                    text(
                        "ALTER TABLE disciplineevent MODIFY response_type "
                        "ENUM('SHABBAT', 'HEARING', 'TRIAL', 'UNIFORM_INSPECTION', "
                        "'CLEANLINESS_INSPECTION', 'REPRIMAND_TALK', 'FOUR_CORNERS', "
                        "'EXIT_HOURS', 'OTHER') NULL"
                    )
                )
                conn.commit()


def init_db_and_seed() -> None:
    """Initialize database with empty schema - no seed data."""
    Base.metadata.create_all(bind=engine)
    _ensure_student_relationship_columns()
    _ensure_personal_columns()
    _migrate_student_status_to_active_terminated()
    _ensure_personal_number_column()
    _ensure_profile_image_column()
    _ensure_discipline_status_column()
    _ensure_medical_event_columns()
    _ensure_medical_profile_notes()
    _ensure_command_summary_title()
    _update_discipline_response_type_enum()

