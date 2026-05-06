"""
Bakatz (leave request) model for tracking trainee leave requests.
"""
from datetime import date
from enum import Enum as PyEnum

from sqlalchemy import Column, Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class BakatzStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    CANCELLED = "cancelled"


class Bakatz(Base):
    """Leave request (Bakatz) for a trainee."""
    __tablename__ = "bakatz"

    student_id = Column(Integer, ForeignKey("student.id"), nullable=False, index=True)
    request_date = Column(Date, nullable=False, index=True)  # When request was submitted
    leave_start_date = Column(Date, nullable=False, index=True)  # Actual leave start
    leave_end_date = Column(Date, nullable=False, index=True)  # Actual leave end
    destination = Column(String(255), nullable=True)  # Location/destination
    transportation_method = Column(String(100), nullable=True)  # How they're traveling
    notes = Column(Text, nullable=True)  # Additional notes with rich text support
    status = Column(Enum(BakatzStatus), default=BakatzStatus.PENDING, nullable=False, index=True)

    student = relationship("Student", back_populates="bakatzim")

    def __repr__(self):
        return f"<Bakatz(id={self.id}, student_id={self.student_id}, status='{self.status}', leave_start='{self.leave_start_date}')>"
