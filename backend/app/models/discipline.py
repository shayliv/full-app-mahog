from datetime import date
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class DisciplineEventType(str, PyEnum):
    INDIVIDUAL = "individual"
    MULTI_STUDENT = "multi_student"
    CLASS_TRACK = "class_track"


class DisciplineResponseType(str, PyEnum):
    SHABBAT = "shabbat"
    HEARING = "hearing"
    TRIAL = "trial"
    UNIFORM_INSPECTION = "uniform_inspection"
    CLEANLINESS_INSPECTION = "cleanliness_inspection"
    REPRIMAND_TALK = "reprimand_talk"
    FOUR_CORNERS = "four_corners"
    EXIT_HOURS = "exit_hours"
    OTHER = "other"


class DisciplineStatus(str, PyEnum):
    TOLD = "told"  # נאמר - told to submit report
    SUBMITTED = "submitted"  # הגיש/ה - submitted report
    DECIDED = "decided"  # הוחלט - punishment decided
    DELIVERED = "delivered"  # נמסר - punishment delivered to trainee
    COMPLETED = "completed"  # בוצע - punishment completed


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

