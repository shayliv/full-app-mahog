from datetime import date
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class DisciplineEventType(str, PyEnum):
    INDIVIDUAL = "INDIVIDUAL"
    MULTI_STUDENT = "MULTI_STUDENT"
    CLASS_TRACK = "CLASS_TRACK"


class DisciplineResponseType(str, PyEnum):
    SHABBAT = "SHABBAT"
    HEARING = "HEARING"
    TRIAL = "TRIAL"
    UNIFORM_INSPECTION = "UNIFORM_INSPECTION"
    CLEANLINESS_INSPECTION = "CLEANLINESS_INSPECTION"
    REPRIMAND_TALK = "REPRIMAND_TALK"
    FOUR_CORNERS = "FOUR_CORNERS"
    EXIT_HOURS = "EXIT_HOURS"
    OTHER = "OTHER"


class DisciplineStatus(str, PyEnum):
    TOLD = "TOLD"
    SUBMITTED = "SUBMITTED"
    DECIDED = "DECIDED"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"


class DisciplineEvent(Base):
    event_type = Column(Enum(DisciplineEventType), nullable=False, index=True)
    description = Column(Text, nullable=False)
    date = Column(Date, nullable=False, index=True)
    reporting_commander = Column(String(255), nullable=False, index=True)
    attachment_path = Column(String(255), nullable=True)
    response_type = Column(Enum(DisciplineResponseType), nullable=True)
    response_other_text = Column(String(255), nullable=True)
    status = Column(Enum(DisciplineStatus), default=DisciplineStatus.TOLD, nullable=False, index=True)
    punishment_delivered = Column(Boolean, default=False, nullable=False)
    punishment_completed = Column(Boolean, default=False, nullable=False)
    remarks = Column(Text, nullable=False)

    students = relationship(
        "DisciplineEventStudentLink",
        back_populates="discipline_event",
        cascade="all, delete-orphan",
    )


class DisciplineEventStudentLink(Base):
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False, index=True)
    discipline_event_id = Column(
        Integer, ForeignKey("disciplineevent.id"), nullable=False, index=True
    )

    student = relationship("Student", back_populates="discipline_events")
    discipline_event = relationship("DisciplineEvent", back_populates="students")

