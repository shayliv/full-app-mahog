"""
Trainee check-in model for daily attendance tracking.
"""
from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class TraineeCheckIn(Base):
    """Daily check-in record for trainee attendance."""
    __tablename__ = "trainee_check_in"

    student_id = Column(Integer, ForeignKey("student.id"), nullable=False, index=True)
    commander_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    check_in_time = Column(DateTime(timezone=True), nullable=False)
    check_in_date = Column(Date, nullable=False, index=True)
    notes = Column(String(500), nullable=True)

    student = relationship("Student", foreign_keys=[student_id])
    commander = relationship("User", foreign_keys=[commander_id])

    def __repr__(self):
        return f"<TraineeCheckIn(id={self.id}, student_id={self.student_id}, date='{self.check_in_date}')>"
