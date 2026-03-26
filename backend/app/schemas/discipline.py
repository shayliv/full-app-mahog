from datetime import date
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class DisciplineEventType(str, Enum):
    INDIVIDUAL = "individual"
    MULTI_STUDENT = "multi_student"
    CLASS_TRACK = "class_track"


class DisciplineResponseType(str, Enum):
    SHABBAT = "shabbat"
    HEARING = "hearing"
    TRIAL = "trial"
    UNIFORM_INSPECTION = "uniform_inspection"
    CLEANLINESS_INSPECTION = "cleanliness_inspection"
    REPRIMAND_TALK = "reprimand_talk"
    FOUR_CORNERS = "four_corners"
    OTHER = "other"


class DisciplineEventBase(BaseModel):
    event_type: DisciplineEventType
    description: str
    date: date
    reporting_commander: str
    attachment_path: Optional[str] = None
    response_type: Optional[DisciplineResponseType] = None
    response_other_text: Optional[str] = None
    punishment_delivered: bool = False
    punishment_completed: bool = False
    remarks: str = Field(..., min_length=1)


class DisciplineEventCreate(DisciplineEventBase):
    student_ids: List[int]


class DisciplineEventUpdate(BaseModel):
    description: Optional[str] = None
    date: Optional[date] = None
    reporting_commander: Optional[str] = None
    attachment_path: Optional[str] = None
    response_type: Optional[DisciplineResponseType] = None
    response_other_text: Optional[str] = None
    punishment_delivered: Optional[bool] = None
    punishment_completed: Optional[bool] = None
    remarks: Optional[str] = None


class DisciplineEvent(BaseModel):
    id: int
    event_type: DisciplineEventType
    description: str
    date: date
    reporting_commander: str
    attachment_path: Optional[str] = None
    response_type: Optional[DisciplineResponseType] = None
    response_other_text: Optional[str] = None
    punishment_delivered: bool
    punishment_completed: bool
    remarks: str
    student_ids: List[int]

    class Config:
        from_attributes = True

