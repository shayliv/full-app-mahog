from datetime import date

from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Test(Base):
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    date = Column(Date, nullable=False, index=True)
    grade = Column(Float, nullable=False)

    student = relationship("Student", back_populates="tests")


class Exercise(Base):
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    attachment_path = Column(String(255), nullable=True)

    student = relationship("Student", back_populates="exercises")

