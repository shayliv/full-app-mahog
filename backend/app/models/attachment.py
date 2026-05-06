"""
Attachment model for storing file uploads across different entities.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Attachment(Base):
    """
    Generic attachment model for linking files to various entities.
    Uses polymorphic association pattern.
    """
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(500), nullable=False)  # Original filename
    file_path = Column(String(1000), nullable=False)  # Stored path
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(255), nullable=False)  # Content type
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Optional: Track who uploaded (for audit purposes)
    uploaded_by_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])

    # Polymorphic association - links to any entity
    entity_type = Column(String(100), nullable=False, index=True)  # e.g., "discipline_event", "medical_event"
    entity_id = Column(Integer, nullable=False, index=True)  # ID of the related entity

    def __repr__(self):
        return f"<Attachment(id={self.id}, file_name='{self.file_name}', entity_type='{self.entity_type}', entity_id={self.entity_id})>"
