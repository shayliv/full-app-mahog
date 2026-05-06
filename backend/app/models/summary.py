from sqlalchemy import Column, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class CommandSummary(Base):
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False, index=True)
    commander_name = Column(String(255), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    title = Column(String(255), nullable=True)  # Optional title for the summary
    text = Column(Text, nullable=False)
    attachment_path = Column(String(255), nullable=True)

    student = relationship("Student", back_populates="command_summaries")

