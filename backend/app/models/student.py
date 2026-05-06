from enum import Enum as PyEnum

import json
from sqlalchemy import Boolean, Column, Date, Enum, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class StudentStatus(str, PyEnum):
    ACTIVE = "active"
    TERMINATED = "terminated"


class Student(Base):
    profile_image = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=False, index=True)
    id_number = Column(String(32), nullable=False, unique=True, index=True)
    personal_number = Column(String(32), nullable=True, unique=True, index=True)
    course_name = Column(String(255), nullable=False, index=True)
    track = Column(String(255), nullable=False, index=True)
    class_name = Column(String(255), nullable=False, index=True)

    # Legacy string field kept for compatibility; real relations use commander_id.
    commander_name = Column(String(255), nullable=False, index=True)

    # Direct commander (מפקד) for this student.
    commander_id = Column(Integer, ForeignKey("user.id"), nullable=True, index=True)

    # Department manager (רמ"ג) for this student.
    department_manager_id = Column(Integer, ForeignKey("user.id"), nullable=True, index=True)

    # Optional explicit department for the student; usually implied by commander.
    department_id = Column(Integer, ForeignKey("department.id"), nullable=True, index=True)
    status = Column(
        Enum(StudentStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=StudentStatus.ACTIVE,
        nullable=False,
    )

    birth_date = Column(Date, nullable=True)
    parents_json = Column(Text, nullable=True)
    address_city = Column(String(255), nullable=True)
    address_street = Column(String(255), nullable=True)
    address_is_far = Column(Boolean, default=False, nullable=True)

    medical_profile = relationship(
        "MedicalProfile", back_populates="student", uselist=False
    )
    discipline_events = relationship(
        "DisciplineEventStudentLink", back_populates="student", cascade="all, delete-orphan"
    )
    tests = relationship("Test", back_populates="student", cascade="all, delete-orphan")
    exercises = relationship(
        "Exercise", back_populates="student", cascade="all, delete-orphan"
    )
    medical_events = relationship(
        "MedicalEvent", back_populates="student", cascade="all, delete-orphan"
    )
    command_summaries = relationship(
        "CommandSummary", back_populates="student", cascade="all, delete-orphan"
    )
    bakatzim = relationship(
        "Bakatz", back_populates="student", cascade="all, delete-orphan"
    )

    commander = relationship(
        "User",
        back_populates="students",
        foreign_keys=[commander_id],
    )

    department_manager = relationship(
        "User",
        back_populates="managed_students",
        foreign_keys=[department_manager_id],
    )

    department = relationship(
        "Department",
        back_populates="students",
        foreign_keys=[department_id],
    )

    @property
    def parents(self):
        if not self.parents_json:
            return None
        try:
            return json.loads(self.parents_json)
        except (json.JSONDecodeError, TypeError):
            return None
