"""
Pydantic schemas for file attachments.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AttachmentBase(BaseModel):
    """Base attachment schema"""
    file_name: str
    file_size: int
    mime_type: str
    entity_type: str
    entity_id: int


class AttachmentCreate(AttachmentBase):
    """Schema for creating attachments"""
    file_path: str
    uploaded_by_id: Optional[int] = None


class AttachmentResponse(AttachmentBase):
    """Schema for attachment responses"""
    id: int
    file_path: str
    uploaded_at: datetime
    uploaded_by_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class AttachmentList(BaseModel):
    """Schema for listing attachments"""
    id: int
    file_name: str
    file_size: int
    mime_type: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
