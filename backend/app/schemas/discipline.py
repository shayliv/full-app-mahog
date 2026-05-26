from datetime import date as DateType
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class DisciplineEventType(str, Enum):
    INDIVIDUAL = "INDIVIDUAL"
    MULTI_STUDENT = "MULTI_STUDENT"
    CLASS_TRACK = "CLASS_TRACK"


class DisciplineResponseType(str, Enum):
    SHABBAT = "SHABBAT"
    HEARING = "HEARING"
    TRIAL = "TRIAL"
    UNIFORM_INSPECTION = "UNIFORM_INSPECTION"
    CLEANLINESS_INSPECTION = "CLEANLINESS_INSPECTION"
    REPRIMAND_TALK = "REPRIMAND_TALK"
    FOUR_CORNERS = "FOUR_CORNERS"
    EXIT_HOURS = "EXIT_HOURS"
    OTHER = "OTHER"


class DisciplineStatus(str, Enum):
    TOLD = "TOLD"
    SUBMITTED = "SUBMITTED"
    DECIDED = "DECIDED"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"


class DisciplineEventBase(BaseModel):
    event_type: DisciplineEventType
    description: str
    date: DateType
    reporting_commander: str
    attachment_path: Optional[str] = None
    response_type: Optional[DisciplineResponseType] = None
    response_other_text: Optional[str] = None
    status: DisciplineStatus = DisciplineStatus.TOLD
    punishment_delivered: bool = False
    punishment_completed: bool = False
    remarks: str = Field(..., min_length=1)


class DisciplineEventCreate(DisciplineEventBase):
    student_ids: List[int]


class DisciplineEventUpdate(BaseModel):
    description: Optional[str] = None
    date: Optional[DateType] = None
    reporting_commander: Optional[str] = None
    attachment_path: Optional[str] = None
    response_type: Optional[DisciplineResponseType] = None
    response_other_text: Optional[str] = None
    status: Optional[DisciplineStatus] = None
    punishment_delivered: Optional[bool] = None
    punishment_completed: Optional[bool] = None
    remarks: Optional[str] = None


class DisciplineEvent(BaseModel):
    id: int
    event_type: DisciplineEventType
    description: str
    date: DateType
    reporting_commander: str
    attachment_path: Optional[str] = None
    response_type: Optional[DisciplineResponseType] = None
    response_other_text: Optional[str] = None
    status: DisciplineStatus
    punishment_delivered: bool
    punishment_completed: bool
    remarks: str
    student_ids: List[int]

    class Config:
        from_attributes = True

