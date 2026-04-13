from typing import Optional, List
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from app.db.session import get_db
from app.models.student import Student as StudentModel
from app.models.medical import MedicalProfile as MedicalProfileModel, MedicalEvent as MedicalEventModel, MedicalEventStatus
from app.models.evaluation import Test as TestModel


router = APIRouter()


# Medical View Schemas
class MedicalEventInfo(BaseModel):
    id: int
    event_type: str
    start_date: date
    end_date: Optional[date]
    status: str

    class Config:
        from_attributes = True


class StudentMedicalView(BaseModel):
    id: int
    full_name: str
    id_number: str
    track: str
    commander_name: str
    medical_profile: Optional[str] = None
    permanent_exemptions: Optional[str] = None
    temporary_exemptions: Optional[str] = None
    allergies: Optional[str] = None
    diet: Optional[str] = None
    active_events_count: int = 0
    latest_event_type: Optional[str] = None


class MedicalViewResponse(BaseModel):
    items: List[StudentMedicalView]
    total: int


# Evaluation View Schemas
class TestInfo(BaseModel):
    id: int
    name: str
    date: date
    grade: float

    class Config:
        from_attributes = True


class StudentEvaluationView(BaseModel):
    id: int
    full_name: str
    id_number: str
    track: str
    commander_name: str
    average_grade: Optional[float] = None
    test_count: int = 0
    lowest_grade: Optional[float] = None
    highest_grade: Optional[float] = None
    latest_test_name: Optional[str] = None
    latest_test_grade: Optional[float] = None


class EvaluationViewResponse(BaseModel):
    items: List[StudentEvaluationView]
    total: int


@router.get("/medical", response_model=MedicalViewResponse)
def get_medical_view(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,  # "active", "all"
    search: Optional[str] = None,
):
    """Get students with medical information for medical view."""
    query = db.query(StudentModel).filter(StudentModel.deleted_at.is_(None))

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                StudentModel.full_name.ilike(like),
                StudentModel.id_number.ilike(like),
            )
        )

    # Filter by medical status if specified
    if status_filter == "active":
        query = query.join(StudentModel.medical_events).filter(
            MedicalEventModel.status == MedicalEventStatus.ACTIVE
        ).distinct()

    total = query.count()
    students = query.offset(skip).limit(limit).all()

    items = []
    for student in students:
        # Get medical profile
        medical_profile = db.query(MedicalProfileModel).filter(
            MedicalProfileModel.student_id == student.id
        ).first()

        # Count active events
        active_events = db.query(MedicalEventModel).filter(
            MedicalEventModel.student_id == student.id,
            MedicalEventModel.status == MedicalEventStatus.ACTIVE
        ).all()

        # Get latest event
        latest_event = db.query(MedicalEventModel).filter(
            MedicalEventModel.student_id == student.id
        ).order_by(MedicalEventModel.start_date.desc()).first()

        items.append(StudentMedicalView(
            id=student.id,
            full_name=student.full_name,
            id_number=student.id_number,
            track=student.track,
            commander_name=student.commander_name,
            medical_profile=medical_profile.medical_profile if medical_profile else None,
            permanent_exemptions=medical_profile.permanent_exemptions if medical_profile else None,
            temporary_exemptions=medical_profile.temporary_exemptions if medical_profile else None,
            allergies=medical_profile.allergies if medical_profile else None,
            diet=medical_profile.diet if medical_profile else None,
            active_events_count=len(active_events),
            latest_event_type=latest_event.event_type.value if latest_event else None,
        ))

    return MedicalViewResponse(items=items, total=total)


@router.get("/evaluation", response_model=EvaluationViewResponse)
def get_evaluation_view(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    min_grade: Optional[float] = None,
    max_grade: Optional[float] = None,
    search: Optional[str] = None,
):
    """Get students with evaluation information for professional view."""
    query = db.query(StudentModel).filter(StudentModel.deleted_at.is_(None))

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                StudentModel.full_name.ilike(like),
                StudentModel.id_number.ilike(like),
            )
        )

    total = query.count()
    students = query.offset(skip).limit(limit).all()

    items = []
    for student in students:
        # Get all tests for the student
        tests = db.query(TestModel).filter(
            TestModel.student_id == student.id
        ).order_by(TestModel.date.desc()).all()

        # Calculate stats
        test_count = len(tests)
        average_grade = None
        lowest_grade = None
        highest_grade = None
        latest_test_name = None
        latest_test_grade = None

        if tests:
            grades = [t.grade for t in tests]
            average_grade = sum(grades) / len(grades)
            lowest_grade = min(grades)
            highest_grade = max(grades)
            latest_test_name = tests[0].name
            latest_test_grade = tests[0].grade

        # Apply grade filters
        if min_grade is not None and (average_grade is None or average_grade < min_grade):
            continue
        if max_grade is not None and (average_grade is None or average_grade > max_grade):
            continue

        items.append(StudentEvaluationView(
            id=student.id,
            full_name=student.full_name,
            id_number=student.id_number,
            track=student.track,
            commander_name=student.commander_name,
            average_grade=average_grade,
            test_count=test_count,
            lowest_grade=lowest_grade,
            highest_grade=highest_grade,
            latest_test_name=latest_test_name,
            latest_test_grade=latest_test_grade,
        ))

    return EvaluationViewResponse(items=items, total=len(items))
