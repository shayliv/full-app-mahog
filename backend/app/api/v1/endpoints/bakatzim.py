"""
API endpoints for Bakatzim (leave requests).
"""
from typing import List, Optional
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.db.session import get_db
from app.models.bakatz import Bakatz
from app.models.student import Student
from app.schemas.bakatz import BakatzCreate, BakatzUpdate, BakatzResponse
from app.utils.text_sanitizer import sanitize_html

router = APIRouter()


@router.get("/", response_model=List[BakatzResponse])
def list_bakatzim_for_student(
    student_id: int,
    db: Session = Depends(get_db),
):
    """
    List all bakatzim (leave requests) for a specific student.

    Args:
        student_id: ID of the student

    Returns:
        List of leave requests for the student
    """
    bakatzim = (
        db.query(Bakatz)
        .filter(Bakatz.student_id == student_id, Bakatz.deleted_at.is_(None))
        .order_by(Bakatz.leave_start_date.desc())
        .all()
    )
    return bakatzim


@router.post("/", response_model=BakatzResponse, status_code=status.HTTP_201_CREATED)
def create_bakatz(
    student_id: int,
    bakatz_in: BakatzCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new bakatz (leave request) for a student.

    Args:
        student_id: ID of the student
        bakatz_in: Bakatz data

    Returns:
        Created bakatz
    """
    # Verify student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    # Sanitize HTML in notes field
    notes = sanitize_html(bakatz_in.notes) if bakatz_in.notes else None

    bakatz = Bakatz(
        student_id=student_id,
        request_date=bakatz_in.request_date,
        leave_start_date=bakatz_in.leave_start_date,
        leave_end_date=bakatz_in.leave_end_date,
        destination=bakatz_in.destination,
        transportation_method=bakatz_in.transportation_method,
        notes=notes,
        status=bakatz_in.status,
    )

    db.add(bakatz)
    db.commit()
    db.refresh(bakatz)

    return bakatz


@router.put("/{bakatz_id}", response_model=BakatzResponse)
def update_bakatz(
    student_id: int,
    bakatz_id: int,
    bakatz_in: BakatzUpdate,
    db: Session = Depends(get_db),
):
    """
    Update a bakatz (leave request).

    Args:
        student_id: ID of the student
        bakatz_id: ID of the bakatz
        bakatz_in: Updated bakatz data

    Returns:
        Updated bakatz
    """
    bakatz = (
        db.query(Bakatz)
        .filter(
            Bakatz.id == bakatz_id,
            Bakatz.student_id == student_id,
            Bakatz.deleted_at.is_(None)
        )
        .first()
    )

    if not bakatz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bakatz not found"
        )

    # Update fields
    update_data = bakatz_in.model_dump(exclude_unset=True)

    # Sanitize HTML in notes if provided
    if "notes" in update_data and update_data["notes"] is not None:
        update_data["notes"] = sanitize_html(update_data["notes"])

    for field, value in update_data.items():
        setattr(bakatz, field, value)

    db.commit()
    db.refresh(bakatz)

    return bakatz


@router.delete("/{bakatz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bakatz(
    student_id: int,
    bakatz_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a bakatz (leave request) - soft delete.

    Args:
        student_id: ID of the student
        bakatz_id: ID of the bakatz
    """
    bakatz = (
        db.query(Bakatz)
        .filter(
            Bakatz.id == bakatz_id,
            Bakatz.student_id == student_id,
            Bakatz.deleted_at.is_(None)
        )
        .first()
    )

    if not bakatz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bakatz not found"
        )

    # Soft delete
    from datetime import datetime
    bakatz.deleted_at = datetime.utcnow()
    db.commit()

    return None
