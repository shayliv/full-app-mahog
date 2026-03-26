from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.summary import CommandSummary as CommandSummaryModel
from app.schemas import (
    CommandSummary,
    CommandSummaryCreate,
    CommandSummaryUpdate,
)


router = APIRouter()


@router.get("/", response_model=List[CommandSummary])
def list_command_summaries(
    student_id: int, db: Session = Depends(get_db)
) -> List[CommandSummary]:
    summaries = (
        db.query(CommandSummaryModel)
        .filter(CommandSummaryModel.student_id == student_id)
        .order_by(CommandSummaryModel.date.desc())
        .all()
    )
    return [CommandSummary.from_orm(s) for s in summaries]


@router.post("/", response_model=CommandSummary, status_code=status.HTTP_201_CREATED)
def create_command_summary(
    student_id: int,
    summary_in: CommandSummaryCreate,
    db: Session = Depends(get_db),
) -> CommandSummary:
    summary = CommandSummaryModel(student_id=student_id, **summary_in.model_dump())
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return CommandSummary.from_orm(summary)


@router.put("/{summary_id}", response_model=CommandSummary)
def update_command_summary(
    student_id: int,
    summary_id: int,
    summary_in: CommandSummaryUpdate,
    db: Session = Depends(get_db),
) -> CommandSummary:
    summary = (
        db.query(CommandSummaryModel)
        .filter(
            CommandSummaryModel.id == summary_id,
            CommandSummaryModel.student_id == student_id,
        )
        .first()
    )
    if not summary:
        raise HTTPException(status_code=404, detail="Command summary not found")

    for field, value in summary_in.model_dump(exclude_unset=True).items():
        setattr(summary, field, value)

    db.add(summary)
    db.commit()
    db.refresh(summary)
    return CommandSummary.from_orm(summary)


@router.delete("/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_command_summary(
    student_id: int, summary_id: int, db: Session = Depends(get_db)
) -> None:
    summary = (
        db.query(CommandSummaryModel)
        .filter(
            CommandSummaryModel.id == summary_id,
            CommandSummaryModel.student_id == student_id,
        )
        .first()
    )
    if not summary:
        raise HTTPException(status_code=404, detail="Command summary not found")
    db.delete(summary)
    db.commit()

