from datetime import date
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class MedicalEventType(str, Enum):
    SICK_CALL = "sick_call"
    DOCTOR_REFERRAL = "doctor_referral"
    EXEMPTION = "exemption"
    MEDICAL_LEAVE = "medical_leave"
    OTHER = "other"


class MedicalEventStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"


class MedicalProfileBase(BaseModel):
    medical_profile: Optional[str] = None
    permanent_exemptions: Optional[str] = None
    temporary_exemptions: Optional[str] = None
    allergies: Optional[str] = None
    diet: Optional[str] = None


class MedicalProfileCreate(MedicalProfileBase):
    pass


class MedicalProfileUpdate(MedicalProfileBase):
    pass


class MedicalProfile(MedicalProfileBase):
    id: int

    class Config:
        from_attributes = True


class MedicalEventBase(BaseModel):
    event_type: MedicalEventType
    start_date: date
    end_date: Optional[date] = None
    status: MedicalEventStatus
    document_path: Optional[str] = None


class MedicalEventCreate(MedicalEventBase):
    pass


class MedicalEventUpdate(BaseModel):
    event_type: Optional[MedicalEventType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[MedicalEventStatus] = None
    document_path: Optional[str] = None


class MedicalEvent(MedicalEventBase):
    id: int

    class Config:
        from_attributes = True

