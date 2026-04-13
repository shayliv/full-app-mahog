from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.department import Department


router = APIRouter()


class DepartmentItem(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


@router.get("/", response_model=list[DepartmentItem])
def list_departments(db: Session = Depends(get_db)) -> list[DepartmentItem]:
    """Return all departments."""
    departments = (
        db.query(Department)
        .filter(Department.deleted_at.is_(None))
        .order_by(Department.name)
        .all()
    )
    return [DepartmentItem.from_orm(d) for d in departments]
