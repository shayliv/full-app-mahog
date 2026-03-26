from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import (
    CommandSummary,
    DisciplineEvent,
    DisciplineEventStudentLink,
    Exercise,
    Student,
    Test,
)
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.medical import (
    MedicalEvent,
    MedicalEventStatus,
    MedicalEventType,
    MedicalProfile,
)
from app.models.discipline import DisciplineEventType, DisciplineResponseType
from app.models.student import StudentStatus


def _ensure_personal_number_column_and_seed() -> None:
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

    # Seed 7-digit personal numbers for students that don't have one.
    db: Session = SessionLocal()
    try:
        students_without_personal = (
            db.query(Student)
            .filter(Student.personal_number.is_(None))
            .order_by(Student.id)
            .all()
        )
        base_number = 800001
        for idx, student in enumerate(students_without_personal):
            student.personal_number = f"{base_number + idx:07d}"

        if students_without_personal:
            db.commit()
    finally:
        db.close()


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


def _seed_commanders_and_departments_if_missing() -> None:
    """Seed departments and commanders when none exist (e.g. existing DB without them)."""
    db: Session = SessionLocal()
    try:
        if db.query(Department).first():
            return

        dept_artillery = Department(name="מגמת תותחנים")
        dept_communications = Department(name="מגמת קשר")
        db.add_all([dept_artillery, dept_communications])
        db.flush()

        dm_artillery = User(
            full_name='רס"ן דוד לוי',
            role=UserRole.DEPARTMENT_MANAGER,
            department_id=dept_artillery.id,
        )
        commander_levi = User(
            full_name="סמל לוי",
            role=UserRole.COMMANDER,
            department_id=dept_artillery.id,
        )
        dm_communications = User(
            full_name='רס"ן רונית כהן',
            role=UserRole.DEPARTMENT_MANAGER,
            department_id=dept_communications.id,
        )
        commander_cohen = User(
            full_name="סמלית כהן",
            role=UserRole.COMMANDER,
            department_id=dept_communications.id,
        )
        db.add_all([dm_artillery, commander_levi, dm_communications, commander_cohen])
        db.flush()

        dept_artillery.top_commander_id = dm_artillery.id
        dept_communications.top_commander_id = dm_communications.id
        db.add(dept_artillery)
        db.add(dept_communications)
        db.flush()

        # Link existing students by commander_name if they have no commander_id
        name_to_commander = {
            commander_levi.full_name: (commander_levi, dept_artillery, dm_artillery),
            commander_cohen.full_name: (commander_cohen, dept_communications, dm_communications),
        }
        for student in db.query(Student).filter(Student.deleted_at.is_(None)):
            if student.commander_id is not None:
                continue
            t = name_to_commander.get(student.commander_name)
            if t:
                commander, dept, dm = t
                student.commander_id = commander.id
                student.department_id = dept.id
                student.department_manager_id = dm.id
                db.add(student)

        db.commit()
    finally:
        db.close()


def init_db_and_seed() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_student_relationship_columns()
    _ensure_personal_columns()
    _migrate_student_status_to_active_terminated()
    _ensure_personal_number_column_and_seed()
    _seed_commanders_and_departments_if_missing()

    db: Session = SessionLocal()
    try:
        # If there are already students, assume the DB is seeded.
        if db.query(Student).first():
            return

        # Use existing departments and commanders (created by _seed_commanders_and_departments_if_missing)
        dept_artillery = db.query(Department).filter(Department.name == "מגמת תותחנים").first()
        dept_communications = db.query(Department).filter(Department.name == "מגמת קשר").first()
        commander_levi = db.query(User).filter(User.full_name == "סמל לוי", User.role == UserRole.COMMANDER).first()
        commander_cohen = db.query(User).filter(User.full_name == "סמלית כהן", User.role == UserRole.COMMANDER).first()
        dm_artillery = db.query(User).filter(User.full_name == 'רס"ן דוד לוי', User.role == UserRole.DEPARTMENT_MANAGER).first()
        dm_communications = db.query(User).filter(User.full_name == 'רס"ן רונית כהן', User.role == UserRole.DEPARTMENT_MANAGER).first()

        if not all([dept_artillery, dept_communications, commander_levi, commander_cohen, dm_artillery, dm_communications]):
            dept_artillery = dept_artillery or Department(name="מגמת תותחנים")
            dept_communications = dept_communications or Department(name="מגמת קשר")
            db.add_all([dept_artillery, dept_communications])
            db.flush()
            dm_artillery = dm_artillery or User(full_name='רס"ן דוד לוי', role=UserRole.DEPARTMENT_MANAGER, department_id=dept_artillery.id)
            commander_levi = commander_levi or User(full_name="סמל לוי", role=UserRole.COMMANDER, department_id=dept_artillery.id)
            dm_communications = dm_communications or User(full_name='רס"ן רונית כהן', role=UserRole.DEPARTMENT_MANAGER, department_id=dept_communications.id)
            commander_cohen = commander_cohen or User(full_name="סמלית כהן", role=UserRole.COMMANDER, department_id=dept_communications.id)
            db.add_all([dm_artillery, commander_levi, dm_communications, commander_cohen])
            db.flush()
            dept_artillery.top_commander_id = dm_artillery.id
            dept_communications.top_commander_id = dm_communications.id
            db.add(dept_artillery)
            db.add(dept_communications)
            db.flush()

        # --- Seed students ---
        student_avi = Student(
            full_name="אבי כהן",
            id_number="123456789",
            personal_number="800001",
            course_name="קורס מחוג",
            track="מגמת תותחנים",
            class_name="מחלקה 1",
            commander_name=commander_levi.full_name,
            commander_id=commander_levi.id,
            department_id=dept_artillery.id,
            department_manager_id=dm_artillery.id,
            status=StudentStatus.ACTIVE,
        )

        student_dana = Student(
            full_name="דנה ישראלי",
            id_number="987654321",
            personal_number="800002",
            course_name="קורס מחוג",
            track="מגמת תותחנים",
            class_name="מחלקה 2",
            commander_name=commander_levi.full_name,
            commander_id=commander_levi.id,
            department_id=dept_artillery.id,
            department_manager_id=dm_artillery.id,
            status=StudentStatus.ACTIVE,
        )

        student_yosi = Student(
            full_name="יוסי ברק",
            id_number="555555555",
            personal_number="800003",
            course_name="קורס מחוג",
            track="מגמת קשר",
            class_name="מחלקה 3",
            commander_name=commander_cohen.full_name,
            commander_id=commander_cohen.id,
            department_id=dept_communications.id,
            department_manager_id=dm_communications.id,
            status=StudentStatus.ACTIVE,
        )

        db.add_all([student_avi, student_dana, student_yosi])
        db.flush()

        # Seed tests
        tests = [
            Test(
                student_id=student_avi.id,
                name="מבחן בסיסי 1",
                date=date(2026, 2, 1),
                grade=72,
            ),
            Test(
                student_id=student_avi.id,
                name="מבחן בסיסי 2",
                date=date(2026, 2, 15),
                grade=85,
            ),
            Test(
                student_id=student_dana.id,
                name="מבחן מקצועי 1",
                date=date(2026, 2, 10),
                grade=58,
            ),
            Test(
                student_id=student_yosi.id,
                name="מבחן קשר 1",
                date=date(2026, 2, 5),
                grade=93,
            ),
        ]
        db.add_all(tests)

        # Seed exercises
        exercises = [
            Exercise(
                student_id=student_avi.id,
                description="תרגיל שטח - ניווט לילה, ביצוע טוב מאוד.",
            ),
            Exercise(
                student_id=student_dana.id,
                description="תרגיל ירי - נדרש שיפור בעבודה בצוות.",
            ),
        ]
        db.add_all(exercises)

        # Seed discipline events
        discipline_event = DisciplineEvent(
            event_type=DisciplineEventType.INDIVIDUAL,
            description="איחור למסדר בוקר ללא הצדקה.",
            date=date(2026, 2, 20),
            reporting_commander="סמל לוי",
            response_type=DisciplineResponseType.SHABBAT,
            response_other_text=None,
            punishment_delivered=True,
            punishment_completed=False,
            remarks="שיחה עם החניך והבהרת נהלים.",
        )
        db.add(discipline_event)
        db.flush()

        db.add(
            DisciplineEventStudentLink(
                student_id=student_avi.id,
                discipline_event_id=discipline_event.id,
            )
        )

        # Seed medical profiles and events
        profile_avi = MedicalProfile(
            student_id=student_avi.id,
            medical_profile="97",
            permanent_exemptions="ללא",
            temporary_exemptions="פטור ריצה שבועיים",
            allergies="ללא",
            diet="רגיל",
        )
        db.add(profile_avi)

        medical_event = MedicalEvent(
            student_id=student_avi.id,
            event_type=MedicalEventType.EXEMPTION,
            start_date=date(2026, 2, 18),
            end_date=date(2026, 3, 4),
            status=MedicalEventStatus.ACTIVE,
        )
        db.add(medical_event)

        # Seed command summaries
        summaries = [
            CommandSummary(
                student_id=student_avi.id,
                commander_name="סמל לוי",
                date="2026-02-22",
                text="חניך בעל מוטיבציה גבוהה, נדרש חיזוק בתחום המשמעת האישית.",
            ),
            CommandSummary(
                student_id=student_dana.id,
                commander_name="סמל לוי",
                date="2026-02-21",
                text="התקדמות טובה מאוד, בולטת בעבודה בצוות.",
            ),
        ]
        db.add_all(summaries)

        db.commit()
    finally:
        db.close()

