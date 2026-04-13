from typing import Optional
import json

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.student import Student as StudentModel
from app.schemas import (
    Student,
    StudentCreate,
    StudentListResponse,
    StudentSummaryMetrics,
    StudentUpdate,
)
from app.schemas.student import ParentInfo
from app.services.alerts import (
    get_student_average_grade,
    get_student_discipline_counts,
    student_has_active_medical_issue,
)


router = APIRouter()


def _parse_parents_json(value) -> Optional[list]:
    if value is None or value == "":
        return None
    try:
        raw = json.loads(value) if isinstance(value, str) else value
        if not raw:
            return None
        return [ParentInfo(**p) if isinstance(p, dict) else p for p in raw]
    except (json.JSONDecodeError, TypeError):
        return None


@router.post("/", response_model=Student, status_code=status.HTTP_201_CREATED)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)) -> Student:
    data = student_in.model_dump()
    parents = data.pop("parents", None)
    data.pop("department_name", None)
    data["parents_json"] = json.dumps(parents) if parents else None
    student = StudentModel(**data)
    db.add(student)
    db.commit()
    db.refresh(student)
    metrics = _build_student_metrics(db, student.id)
    extra = {"metrics": metrics, "parents": _parse_parents_json(student.parents_json)}
    return Student.from_orm(student).model_copy(update=extra)


@router.get("/{student_id}", response_model=Student)
def get_student(student_id: int, db: Session = Depends(get_db)) -> Student:
    student = (
        db.query(StudentModel)
        .options(joinedload(StudentModel.department))
        .filter(StudentModel.id == student_id, StudentModel.deleted_at.is_(None))
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    metrics = _build_student_metrics(db, student.id)
    extra = {
        "metrics": metrics,
        "department_name": student.department.name if student.department else None,
        "parents": _parse_parents_json(student.parents_json),
    }
    return Student.from_orm(student).model_copy(update=extra)


ALLOWED_IMAGE_EXTENSIONS = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@router.post("/{student_id}/profile-image", response_model=Student)
async def upload_student_profile_image(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Student:
    student = (
        db.query(StudentModel)
        .filter(StudentModel.id == student_id, StudentModel.deleted_at.is_(None))
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if file.content_type not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Use JPEG, PNG, GIF, or WebP.",
        )
    from pathlib import Path

    ext = ".jpg" if file.content_type == "image/jpeg" else ".png" if file.content_type == "image/png" else ".gif" if file.content_type == "image/gif" else ".webp"
    static_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / "static" / "uploads" / "students"
    static_dir.mkdir(parents=True, exist_ok=True)
    path = static_dir / f"{student_id}{ext}"
    contents = await file.read()
    path.write_bytes(contents)
    profile_image = f"/static/uploads/students/{student_id}{ext}"
    student.profile_image = profile_image
    db.add(student)
    db.commit()
    db.refresh(student)
    metrics = _build_student_metrics(db, student.id)
    return Student.from_orm(student).model_copy(update={"metrics": metrics})


@router.get("/", response_model=StudentListResponse)
def list_students(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    track: Optional[str] = None,
    class_name: Optional[str] = Query(None, alias="class"),
    commander_name: Optional[str] = None,
    department_id: Optional[int] = None,
    min_discipline_count: Optional[int] = None,
    max_discipline_count: Optional[int] = None,
    has_active_medical_issue: Optional[bool] = None,
    min_average_grade: Optional[float] = None,
    max_average_grade: Optional[float] = None,
):
    query = db.query(StudentModel).filter(StudentModel.deleted_at.is_(None))

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                StudentModel.full_name.ilike(like),
                StudentModel.id_number.ilike(like),
                StudentModel.personal_number.ilike(like),
            )
        )

    if track:
        query = query.filter(StudentModel.track == track)
    if class_name:
        query = query.filter(StudentModel.class_name == class_name)
    if commander_name:
        query = query.filter(StudentModel.commander_name == commander_name)
    if department_id is not None:
        query = query.filter(StudentModel.department_id == department_id)

    total = query.count()
    students = query.offset(skip).limit(limit).all()

    items: list[Student] = []
    for s in students:
        metrics = _build_student_metrics(db, s.id)

        if min_discipline_count is not None and (
            metrics.discipline_count < min_discipline_count
        ):
            continue
        if max_discipline_count is not None and (
            metrics.discipline_count > max_discipline_count
        ):
            continue
        if (
            has_active_medical_issue is not None
            and metrics.has_active_medical_issue != has_active_medical_issue
        ):
            continue
        if (
            min_average_grade is not None
            and (metrics.average_grade or 0) < min_average_grade
        ):
            continue
        if (
            max_average_grade is not None
            and metrics.average_grade is not None
            and metrics.average_grade > max_average_grade
        ):
            continue

        items.append(Student.from_orm(s).model_copy(update={"metrics": metrics}))

    return StudentListResponse(items=items, total=total)


@router.post("/import", status_code=status.HTTP_201_CREATED)
async def import_students_from_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Import students from an Excel or CSV file.
    Expected columns: full_name, id_number, personal_number, course_name, track, class_name, commander_name
    Optional columns: birth_date, address_city, address_street, status
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided.",
        )

    is_csv = file.filename.endswith('.csv')
    is_excel = file.filename.endswith('.xlsx') or file.filename.endswith('.xls')

    if not (is_csv or is_excel):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.",
        )

    try:
        from datetime import datetime
        from io import BytesIO, StringIO
        import csv

        contents = await file.read()

        # Parse file based on type
        if is_csv:
            # Parse CSV file
            text_content = contents.decode('utf-8-sig')  # utf-8-sig handles BOM
            csv_reader = csv.DictReader(StringIO(text_content))
            headers = csv_reader.fieldnames
            rows_data = list(csv_reader)
        else:
            # Parse Excel file
            import openpyxl
            workbook = openpyxl.load_workbook(BytesIO(contents))
            sheet = workbook.active
            headers = [cell.value for cell in sheet[1]]
            rows_data = [dict(zip(headers, row)) for row in sheet.iter_rows(min_row=2, values_only=True)]

        # Column mapping for Hebrew and English headers
        def get_column_value(row, *possible_names):
            """Get value from row using multiple possible column names."""
            for name in possible_names:
                if name in row and row[name] is not None:
                    return row[name]
            return None

        # Check if we have the minimum required fields
        has_name = any(h in headers for h in ['full_name', 'שם פרטי', 'שם משפחה'])
        has_id = any(h in headers for h in ['id_number', 'תז'])

        if not (has_name and has_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required columns. Need: name fields (full_name or שם פרטי+שם משפחה) and ID (id_number or תז)",
            )

        imported_count = 0
        errors = []
        seen_ids = set()  # Track IDs in current import to detect duplicates within file
        seen_personal_numbers = set()  # Track personal numbers

        for row_idx, row_data in enumerate(rows_data, start=2):
            try:
                # Get full name - either from full_name column or combine first+last
                full_name = get_column_value(row_data, 'full_name')
                if not full_name:
                    first_name = get_column_value(row_data, 'שם פרטי', 'first_name')
                    last_name = get_column_value(row_data, 'שם משפחה', 'last_name')
                    if first_name and last_name:
                        full_name = f"{str(first_name).strip()} {str(last_name).strip()}"
                    elif first_name:
                        full_name = str(first_name).strip()
                    elif last_name:
                        full_name = str(last_name).strip()

                # Skip empty rows
                if not full_name:
                    continue

                # Get ID number
                id_number = get_column_value(row_data, 'id_number', 'תז')
                if not id_number:
                    errors.append(f"Row {row_idx}: Missing ID number")
                    continue

                id_number = str(id_number).strip()

                # Check for duplicates within the import file
                if id_number in seen_ids:
                    errors.append(f"Row {row_idx}: Duplicate ID {id_number} in import file")
                    continue

                seen_ids.add(id_number)

                # Check if student already exists in database (including soft-deleted)
                existing = db.query(StudentModel).filter(
                    StudentModel.id_number == id_number
                ).first()

                if existing:
                    if existing.deleted_at is not None:
                        errors.append(f"Row {row_idx}: Student with ID {id_number} exists but was deleted. Please restore or use a different ID.")
                    else:
                        errors.append(f"Row {row_idx}: Student with ID {id_number} already exists")
                    continue

                # Get personal number
                personal_number = get_column_value(row_data, 'personal_number', 'מספר אישי')
                personal_number = str(personal_number).strip() if personal_number else None

                # Check personal number duplicates
                if personal_number:
                    # Check within import file
                    if personal_number in seen_personal_numbers:
                        errors.append(f"Row {row_idx}: Duplicate personal number {personal_number} in import file")
                        continue

                    seen_personal_numbers.add(personal_number)

                    # Check in database
                    existing_personal = db.query(StudentModel).filter(
                        StudentModel.personal_number == personal_number
                    ).first()

                    if existing_personal:
                        errors.append(f"Row {row_idx}: Personal number {personal_number} already exists (student: {existing_personal.full_name})")
                        continue

                # Get optional fields with flexible column names
                course_name = get_column_value(row_data, 'course_name', 'קורס') or 'לא צוין'
                track = get_column_value(row_data, 'track', 'מגמה') or 'לא צוין'
                class_name = get_column_value(row_data, 'class_name', 'כיתה') or 'לא צוין'
                commander_name = get_column_value(row_data, 'commander_name', 'מפקד') or ''
                address_city = get_column_value(row_data, 'address_city', 'עיר מגורים', 'עיר')

                # Prepare student data
                student_data = {
                    'full_name': full_name.strip(),
                    'id_number': id_number,
                    'personal_number': personal_number,
                    'course_name': str(course_name).strip(),
                    'track': str(track).strip(),
                    'class_name': str(class_name).strip(),
                    'commander_name': str(commander_name).strip() if commander_name else '',
                    'status': get_column_value(row_data, 'status', 'סטטוס') or 'active',
                }

                # Optional fields
                birth_date = get_column_value(row_data, 'birth_date', 'תאריך לידה')
                if birth_date:
                    if isinstance(birth_date, datetime):
                        student_data['birth_date'] = birth_date.date()
                    elif isinstance(birth_date, str) and birth_date.strip():
                        try:
                            student_data['birth_date'] = datetime.strptime(birth_date.strip(), '%Y-%m-%d').date()
                        except ValueError:
                            pass

                if address_city:
                    student_data['address_city'] = str(address_city).strip()

                address_street = get_column_value(row_data, 'address_street', 'רחוב')
                if address_street:
                    student_data['address_street'] = str(address_street).strip()

                student = StudentModel(**student_data)
                db.add(student)
                imported_count += 1

            except Exception as e:
                errors.append(f"Row {row_idx}: {str(e)}")
                continue

        db.commit()

        return {
            "message": f"Successfully imported {imported_count} students",
            "imported_count": imported_count,
            "errors": errors if errors else None
        }

    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Required library not installed: {str(e)}",
        )
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file encoding error. Please ensure the file is UTF-8 encoded.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}",
        )


@router.put("/{student_id}", response_model=Student)
def update_student(
    student_id: int, student_in: StudentUpdate, db: Session = Depends(get_db)
) -> Student:
    from app.models import User

    student = (
        db.query(StudentModel)
        .options(joinedload(StudentModel.department))
        .filter(StudentModel.id == student_id, StudentModel.deleted_at.is_(None))
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    updates = student_in.model_dump(exclude_unset=True)
    if "commander_id" in updates and updates["commander_id"] is not None:
        commander = db.query(User).filter(User.id == updates["commander_id"]).first()
        if commander:
            updates["commander_name"] = commander.full_name
            updates["department_id"] = commander.department_id
    elif "commander_id" in updates and updates["commander_id"] is None:
        updates["commander_name"] = ""
        updates["department_id"] = None

    if "parents" in updates:
        raw = updates.pop("parents")
        student.parents_json = json.dumps([p.model_dump() if hasattr(p, "model_dump") else p for p in raw]) if raw else None

    for field, value in updates.items():
        setattr(student, field, value)

    db.add(student)
    db.commit()
    db.refresh(student)

    # Reload with department for department_name in response
    student = (
        db.query(StudentModel)
        .options(joinedload(StudentModel.department))
        .filter(StudentModel.id == student_id)
        .first()
    )
    metrics = _build_student_metrics(db, student.id)
    extra = {
        "metrics": metrics,
        "department_name": student.department.name if student.department else None,
        "parents": _parse_parents_json(student.parents_json),
    }
    return Student.from_orm(student).model_copy(update=extra)
def delete_student(student_id: int, db: Session = Depends(get_db)) -> None:
    student = (
        db.query(StudentModel)
        .filter(StudentModel.id == student_id, StudentModel.deleted_at.is_(None))
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    from datetime import datetime

    student.deleted_at = datetime.utcnow()
    db.add(student)
    db.commit()


def _build_student_metrics(db: Session, student_id: int) -> StudentSummaryMetrics:
    total, recent = get_student_discipline_counts(db, student_id)
    avg_grade = get_student_average_grade(db, student_id)
    has_medical = student_has_active_medical_issue(db, student_id)
    return StudentSummaryMetrics(
        discipline_count=total,
        average_grade=avg_grade,
        has_active_medical_issue=has_medical,
    )

