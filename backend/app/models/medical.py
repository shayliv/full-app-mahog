from datetime import date
from enum import Enum as PyEnum

from sqlalchemy import Column, Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class MedicalEventType(str, PyEnum):
    SICK_CALL = "sick_call"
    DOCTOR_REFERRAL = "doctor_referral"
    EXEMPTION = "exemption"
    MEDICAL_LEAVE = "medical_leave"
    OTHER = "other"


class MedicalEventStatus(str, PyEnum):
    ACTIVE = "active"
    CLOSED = "closed"


class MedicalProfile(Base):
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False, unique=True)
    medical_profile = Column(String(50), nullable=True)
    permanent_exemptions = Column(Text, nullable=True)
    temporary_exemptions = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    diet = Column(String(50), nullable=True)  # vegetarian/vegan/other

    student = relationship("Student", back_populates="medical_profile")


class MedicalEvent(Base):
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False, index=True)
    event_type = Column(Enum(MedicalEventType), nullable=False, index=True)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=True, index=True)
    status = Column(Enum(MedicalEventStatus), nullable=False, index=True)
    document_path = Column(String(255), nullable=True)

    student = relationship("Student", back_populates="medical_events")

