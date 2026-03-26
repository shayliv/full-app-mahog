from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.discipline import DisciplineEvent as DisciplineEventModel
from app.models.discipline import DisciplineEventStudentLink
from app.schemas import (
    DisciplineEvent,
    DisciplineEventCreate,
    DisciplineEventUpdate,
)


router = APIRouter()


@router.get("/", response_model=List[DisciplineEvent])
def list_discipline_events(
    student_id: int,
    db: Session = Depends(get_db),
) -> List[DisciplineEvent]:
    links = (
        db.query(DisciplineEventStudentLink)
        .filter(DisciplineEventStudentLink.student_id == student_id)
        .all()
    )
    event_ids = [l.discipline_event_id for l in links]
    events = (
        db.query(DisciplineEventModel)
        .filter(DisciplineEventModel.id.in_(event_ids))
        .all()
    )
    return [
        DisciplineEvent(
            id=e.id,
            event_type=e.event_type,
            description=e.description,
            date=e.date,
            reporting_commander=e.reporting_commander,
            attachment_path=e.attachment_path,
            response_type=e.response_type,
            response_other_text=e.response_other_text,
            punishment_delivered=e.punishment_delivered,
            punishment_completed=e.punishment_completed,
            remarks=e.remarks,
            student_ids=[
                l.student_id
                for l in e.students  # type: ignore[attr-defined]
            ],
        )
        for e in events
    ]


@router.post("/", response_model=DisciplineEvent, status_code=status.HTTP_201_CREATED)
def create_discipline_event(
    student_id: int,
    event_in: DisciplineEventCreate,
    db: Session = Depends(get_db),
) -> DisciplineEvent:
    if student_id not in event_in.student_ids:
        event_in.student_ids.append(student_id)

    event = DisciplineEventModel(
        event_type=event_in.event_type,
        description=event_in.description,
        date=event_in.date,
        reporting_commander=event_in.reporting_commander,
        attachment_path=event_in.attachment_path,
        response_type=event_in.response_type,
        response_other_text=event_in.response_other_text,
        punishment_delivered=event_in.punishment_delivered,
        punishment_completed=event_in.punishment_completed,
        remarks=event_in.remarks,
    )
    db.add(event)
    db.flush()

    for sid in event_in.student_ids:
        link = DisciplineEventStudentLink(student_id=sid, discipline_event_id=event.id)
        db.add(link)

    db.commit()
    db.refresh(event)

    student_ids = [l.student_id for l in event.students]  # type: ignore[attr-defined]
    return DisciplineEvent(
        id=event.id,
        event_type=event.event_type,
        description=event.description,
        date=event.date,
        reporting_commander=event.reporting_commander,
        attachment_path=event.attachment_path,
        response_type=event.response_type,
        response_other_text=event.response_other_text,
        punishment_delivered=event.punishment_delivered,
        punishment_completed=event.punishment_completed,
        remarks=event.remarks,
        student_ids=student_ids,
    )


@router.put("/{event_id}", response_model=DisciplineEvent)
def update_discipline_event(
    student_id: int,
    event_id: int,
    event_in: DisciplineEventUpdate,
    db: Session = Depends(get_db),
) -> DisciplineEvent:
    event = db.query(DisciplineEventModel).filter(DisciplineEventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Discipline event not found")

    for field, value in event_in.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    db.add(event)
    db.commit()
    db.refresh(event)

    student_ids = [l.student_id for l in event.students]  # type: ignore[attr-defined]
    return DisciplineEvent(
        id=event.id,
        event_type=event.event_type,
        description=event.description,
        date=event.date,
        reporting_commander=event.reporting_commander,
        attachment_path=event.attachment_path,
        response_type=event.response_type,
        response_other_text=event.response_other_text,
        punishment_delivered=event.punishment_delivered,
        punishment_completed=event.punishment_completed,
        remarks=event.remarks,
        student_ids=student_ids,
    )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discipline_event(
    student_id: int,
    event_id: int,
    db: Session = Depends(get_db),
) -> None:
    event = db.query(DisciplineEventModel).filter(DisciplineEventModel.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Discipline event not found")

    db.query(DisciplineEventStudentLink).filter(
        DisciplineEventStudentLink.discipline_event_id == event_id
    ).delete()
    db.delete(event)
    db.commit()

