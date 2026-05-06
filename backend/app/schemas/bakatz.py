"""
Pydantic schemas for Bakatz (leave requests).
"""
from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class BakatzBase(BaseModel):
    """Base Bakatz schema"""
    request_date: date
    leave_start_date: date
    leave_end_date: date
    destination: Optional[str] = None
    transportation_method: Optional[str] = None
    notes: Optional[str] = None
    status: str = "pending"


class BakatzCreate(BakatzBase):
    """Schema for creating a Bakatz"""
    pass


class BakatzUpdate(BaseModel):
    """Schema for updating a Bakatz"""
    request_date: Optional[date] = None
    leave_start_date: Optional[date] = None
    leave_end_date: Optional[date] = None
    destination: Optional[str] = None
    transportation_method: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class BakatzResponse(BakatzBase):
    """Schema for Bakatz responses"""
    id: int
    student_id: int

    model_config = ConfigDict(from_attributes=True)
