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
    min_discipline_count: Optional[int] = None,
    max_discipline_count: Optional[int] = None,
    has_active_medical_issue: Optional[bool] = None,
    min_average_grade: Optional[float] = None,
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

        items.append(Student.from_orm(s).model_copy(update={"metrics": metrics}))

    return StudentListResponse(items=items, total=total)


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

