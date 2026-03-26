from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.evaluation import Test
from app.models.medical import MedicalEvent, MedicalEventStatus
from app.models.student import Student as StudentModel
from app.schemas import Student
from app.services.alerts import (
    get_student_average_grade,
    get_student_discipline_counts,
    student_has_active_medical_issue,
)


router = APIRouter()


@router.get("/students-below-threshold", response_model=List[Student])
def students_below_threshold(
    db: Session = Depends(get_db),
) -> List[Student]:
    students = (
        db.query(StudentModel).filter(StudentModel.deleted_at.is_(None)).all()
    )
    result: list[Student] = []
    for s in students:
        avg = get_student_average_grade(db, s.id)
        if avg is not None and avg < 60:
            total, _ = get_student_discipline_counts(db, s.id)
            has_medical = student_has_active_medical_issue(db, s.id)
            metrics = {
                "discipline_count": total,
                "average_grade": avg,
                "has_active_medical_issue": has_medical,
            }
            result.append(Student.from_orm(s).model_copy(update={"metrics": metrics}))
    return result


@router.get("/students-with-excessive-discipline", response_model=List[Student])
def students_with_excessive_discipline(
    db: Session = Depends(get_db),
) -> List[Student]:
    students = (
        db.query(StudentModel).filter(StudentModel.deleted_at.is_(None)).all()
    )
    result: list[Student] = []
    for s in students:
        total, recent = get_student_discipline_counts(db, s.id)
        if total > 5 or recent > 2:
            avg = get_student_average_grade(db, s.id)
            has_medical = student_has_active_medical_issue(db, s.id)
            metrics = {
                "discipline_count": total,
                "average_grade": avg,
                "has_active_medical_issue": has_medical,
            }
            result.append(Student.from_orm(s).model_copy(update={"metrics": metrics}))
    return result


@router.get("/students-with-active-medical", response_model=List[Student])
def students_with_active_medical(
    db: Session = Depends(get_db),
) -> List[Student]:
    students = (
        db.query(StudentModel).filter(StudentModel.deleted_at.is_(None)).all()
    )
    result: list[Student] = []
    for s in students:
        if student_has_active_medical_issue(db, s.id):
            total, _ = get_student_discipline_counts(db, s.id)
            avg = get_student_average_grade(db, s.id)
            metrics = {
                "discipline_count": total,
                "average_grade": avg,
                "has_active_medical_issue": True,
            }
            result.append(Student.from_orm(s).model_copy(update={"metrics": metrics}))
    return result


@router.get("/grade-trend", response_model=list[dict])
def grade_trend_by_track(
    db: Session = Depends(get_db),
) -> list[dict]:
    """
    Returns aggregated average grade over time per track.
    """
    # This is a simplified placeholder aggregation for charting.
    tests = db.query(Test).all()
    buckets: dict[tuple[str, str], list[float]] = {}
    for t in tests:
        student = db.query(StudentModel).filter(StudentModel.id == t.student_id).first()
        if not student:
            continue
        key = (student.track, t.date.isoformat())
        buckets.setdefault(key, []).append(t.grade)

    results: list[dict] = []
    for (track, date_str), grades in buckets.items():
        results.append(
            {
                "track": track,
                "date": date_str,
                "average_grade": sum(grades) / len(grades),
            }
        )
    return results


@router.get("/summary-counts", response_model=dict)
def dashboard_summary_counts(db: Session = Depends(get_db)) -> dict:
    students = (
        db.query(StudentModel).filter(StudentModel.deleted_at.is_(None)).all()
    )
    below_threshold = 0
    excessive_discipline = 0
    active_medical = 0

    for s in students:
        avg = get_student_average_grade(db, s.id)
        total, recent = get_student_discipline_counts(db, s.id)
        has_medical = student_has_active_medical_issue(db, s.id)

        if avg is not None and avg < 60:
            below_threshold += 1
        if total > 5 or recent > 2:
            excessive_discipline += 1
        if has_medical:
            active_medical += 1

    return {
        "students_below_threshold": below_threshold,
        "students_with_excessive_discipline": excessive_discipline,
        "students_with_active_medical": active_medical,
    }

