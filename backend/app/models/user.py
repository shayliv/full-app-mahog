from enum import Enum as PyEnum

from sqlalchemy import Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class UserRole(str, PyEnum):
    DEPARTMENT_MANAGER = "department_manager"
    COMMANDER = "commander"
    ADMIN = "admin"


class User(Base):
    full_name = Column(String(255), nullable=False, index=True)
    role = Column(Enum(UserRole), nullable=False, index=True)

    # The department this user belongs to.
    department_id = Column(Integer, ForeignKey("department.id"), nullable=True, index=True)

    # Direct commander in the chain of command (None for top-level commanders).
    superior_id = Column(Integer, ForeignKey("user.id"), nullable=True, index=True)

    department = relationship(
        "Department",
        back_populates="commanders",
        foreign_keys=[department_id],
    )

    superior = relationship(
        "User",
        remote_side="User.id",
        back_populates="subordinates",
        foreign_keys=[superior_id],
    )
    subordinates = relationship(
        "User",
        back_populates="superior",
        cascade="all, delete-orphan",
    )

    # Students for whom this user is the direct commander (מפקד).
    students = relationship(
        "Student",
        back_populates="commander",
        foreign_keys="Student.commander_id",
    )

    # Students for whom this user is the department manager (רמ\"ג).
    managed_students = relationship(
        "Student",
        back_populates="department_manager",
        foreign_keys="Student.department_manager_id",
    )

    # For department managers: the department they manage (one-to-one).
    managed_department = relationship(
        "Department",
        back_populates="top_commander",
        uselist=False,
        foreign_keys="Department.top_commander_id",
    )

