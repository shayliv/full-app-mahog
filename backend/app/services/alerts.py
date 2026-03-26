from datetime import date, timedelta
from typing import Iterable

from sqlalchemy.orm import Session

from app.models.discipline import DisciplineEvent, DisciplineEventStudentLink
from app.models.evaluation import Test
from app.models.medical import MedicalEvent, MedicalEventStatus


def get_student_discipline_counts(db: Session, student_id: int) -> tuple[int, int]:
    total = (
        db.query(DisciplineEventStudentLink)
        .filter(DisciplineEventStudentLink.student_id == student_id)
        .count()
    )

    seven_days_ago = date.today() - timedelta(days=7)
    recent = (
        db.query(DisciplineEventStudentLink)
        .join(DisciplineEvent, DisciplineEvent.id == DisciplineEventStudentLink.discipline_event_id)
        .filter(
            DisciplineEventStudentLink.student_id == student_id,
            DisciplineEvent.date >= seven_days_ago,
        )
        .count()
    )
    return total, recent


def get_student_average_grade(db: Session, student_id: int) -> float | None:
    tests: Iterable[Test] = (
        db.query(Test).filter(Test.student_id == student_id).order_by(Test.date).all()
    )
    grades = [t.grade for t in tests]
    if not grades:
        return None
    return sum(grades) / len(grades)


def student_has_active_medical_issue(db: Session, student_id: int) -> bool:
    return (
        db.query(MedicalEvent)
        .filter(
            MedicalEvent.student_id == student_id,
            MedicalEvent.status == MedicalEventStatus.ACTIVE,
        )
        .first()
        is not None
    )

