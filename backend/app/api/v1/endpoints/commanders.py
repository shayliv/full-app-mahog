from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import User, UserRole
from app.models.department import Department
from app.schemas.commanders import CommanderListItem


router = APIRouter()


@router.get("/", response_model=list[CommanderListItem])
def list_commanders(db: Session = Depends(get_db)) -> list[CommanderListItem]:
    """Return all users who can be commanders (COMMANDER or DEPARTMENT_MANAGER role)."""
    rows = (
        db.query(User.id, User.full_name, User.department_id, Department.name)
        .outerjoin(Department, User.department_id == Department.id)
        .filter(User.role.in_([UserRole.COMMANDER, UserRole.DEPARTMENT_MANAGER]))
        .order_by(User.full_name)
        .all()
    )
    return [
        CommanderListItem(
            id=r.id,
            full_name=r.full_name,
            department_id=r.department_id,
            department_name=r.name,
        )
        for r in rows
    ]
