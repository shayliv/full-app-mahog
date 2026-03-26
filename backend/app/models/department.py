from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Department(Base):
    # Department / track name (מגמה)
    name = Column(String(255), nullable=False, unique=True, index=True)

    # Top commander (רמ"ג) for this department.
    top_commander_id = Column(Integer, ForeignKey("user.id"), nullable=True, index=True)

    top_commander = relationship(
        "User",
        back_populates="managed_department",
        foreign_keys=[top_commander_id],
    )

    # All commanders (users) that belong to this department (including top commander).
    commanders = relationship(
        "User",
        back_populates="department",
        cascade="all, delete-orphan",
        foreign_keys="User.department_id",
        primaryjoin="Department.id==User.department_id",
    )

    # Convenience: all students in this department via their department manager.
    students = relationship(
        "Student",
        back_populates="department",
        primaryjoin="Department.id==foreign(Student.department_id)",
        viewonly=True,
    )

