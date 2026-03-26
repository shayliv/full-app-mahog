from datetime import date
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class StudentStatus(str, Enum):
    ACTIVE = "active"
    TERMINATED = "terminated"


class ParentInfo(BaseModel):
    name: str = ""
    phone: str = ""


class StudentBase(BaseModel):
    profile_image: Optional[str] = None
    full_name: str
    id_number: str
    personal_number: Optional[str] = None
    course_name: str
    track: str
    class_name: str
    commander_name: str
    commander_id: Optional[int] = None
    department_manager_id: Optional[int] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    status: StudentStatus = StudentStatus.ACTIVE
    birth_date: Optional[date] = None
    address_city: Optional[str] = None
    address_street: Optional[str] = None
    address_is_far: Optional[bool] = None
    parents: Optional[List[ParentInfo]] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    profile_image: Optional[str] = None
    full_name: Optional[str] = None
    personal_number: Optional[str] = None
    course_name: Optional[str] = None
    track: Optional[str] = None
    class_name: Optional[str] = None
    commander_name: Optional[str] = None
    commander_id: Optional[int] = None
    department_manager_id: Optional[int] = None
    department_id: Optional[int] = None
    status: Optional[StudentStatus] = None
    birth_date: Optional[date] = None
    address_city: Optional[str] = None
    address_street: Optional[str] = None
    address_is_far: Optional[bool] = None
    parents: Optional[List[ParentInfo]] = None


class StudentSummaryMetrics(BaseModel):
    discipline_count: int
    average_grade: Optional[float] = None
    has_active_medical_issue: bool


class StudentInDBBase(StudentBase):
    id: int

    class Config:
        from_attributes = True


class Student(StudentInDBBase):
    metrics: Optional[StudentSummaryMetrics] = None


class StudentListResponse(BaseModel):
    items: List[Student]
    total: int

