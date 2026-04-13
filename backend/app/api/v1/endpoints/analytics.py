from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.discipline import DisciplineEvent, DisciplineEventStudentLink
from app.models.evaluation import Test
from app.models.student import Student
from app.models.department import Department

router = APIRouter()


@router.get("/discipline-timeline")
def get_discipline_timeline(
    db: Session = Depends(get_db),
    department_id: Optional[int] = None,
    days: int = Query(30, ge=1, le=365),
):
    """Get discipline events count over time."""
    start_date = datetime.now().date() - timedelta(days=days)

    query = (
        db.query(
            func.date(DisciplineEvent.date).label("date"),
            func.count(DisciplineEvent.id).label("count"),
        )
        .filter(DisciplineEvent.date >= start_date)
        .group_by(func.date(DisciplineEvent.date))
        .order_by(func.date(DisciplineEvent.date))
    )

    # Filter by department if specified
    if department_id:
        query = (
            query.join(
                DisciplineEventStudentLink,
                DisciplineEvent.id == DisciplineEventStudentLink.discipline_event_id,
            )
            .join(Student, DisciplineEventStudentLink.student_id == Student.id)
            .filter(Student.department_id == department_id, Student.deleted_at.is_(None))
        )

    results = query.all()
    return [{"date": str(r.date), "count": r.count} for r in results]


@router.get("/grades-by-department")
def get_grades_by_department(db: Session = Depends(get_db)):
    """Get average grades by department."""
    results = (
        db.query(
            Department.name.label("department_name"),
            func.avg(Test.grade).label("average_grade"),
            func.count(func.distinct(Student.id)).label("student_count"),
        )
        .join(Student, Department.id == Student.department_id)
        .join(Test, Student.id == Test.student_id)
        .filter(Student.deleted_at.is_(None))
        .group_by(Department.id, Department.name)
        .all()
    )

    return [
        {
            "department_name": r.department_name,
            "average_grade": float(r.average_grade) if r.average_grade else 0,
            "student_count": r.student_count,
        }
        for r in results
    ]


@router.get("/grades-by-test")
def get_grades_by_test(
    db: Session = Depends(get_db),
    department_id: Optional[int] = None,
    limit: int = Query(10, ge=1, le=50),
):
    """Get average grades by test."""
    query = (
        db.query(
            Test.name.label("test_name"),
            Test.date.label("date"),
            func.avg(Test.grade).label("average_grade"),
            func.count(Test.id).label("student_count"),
        )
        .join(Student, Test.student_id == Student.id)
        .filter(Student.deleted_at.is_(None))
    )

    if department_id:
        query = query.filter(Student.department_id == department_id)

    results = (
        query.group_by(Test.name, Test.date)
        .order_by(Test.date.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "test_name": r.test_name,
            "date": str(r.date),
            "average_grade": float(r.average_grade) if r.average_grade else 0,
            "student_count": r.student_count,
        }
        for r in results
    ]


@router.get("/overall-grade")
def get_overall_grade(
    db: Session = Depends(get_db), department_id: Optional[int] = None
):
    """Get overall average grade."""
    query = (
        db.query(
            func.avg(Test.grade).label("average_grade"),
            func.count(func.distinct(Student.id)).label("student_count"),
        )
        .join(Student, Test.student_id == Student.id)
        .filter(Student.deleted_at.is_(None))
    )

    if department_id:
        query = query.filter(Student.department_id == department_id)

    result = query.first()

    return {
        "average_grade": float(result.average_grade) if result.average_grade else 0,
        "student_count": result.student_count if result.student_count else 0,
    }
