"""
API endpoints for file attachments.
"""
import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.attachment import Attachment
from app.schemas.attachment import AttachmentList, AttachmentResponse

router = APIRouter()

# Supported file types and max size
ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/plain",
]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

UPLOAD_BASE_DIR = "static/uploads"


def _save_upload_file(upload_file: UploadFile, entity_type: str, entity_id: int) -> tuple[str, str]:
    """
    Save uploaded file to disk.

    Returns:
        tuple of (file_path, unique_filename)
    """
    # Create directory if it doesn't exist
    entity_dir = os.path.join(UPLOAD_BASE_DIR, entity_type)
    os.makedirs(entity_dir, exist_ok=True)

    # Generate unique filename
    file_extension = os.path.splitext(upload_file.filename or "file")[1]
    unique_filename = f"{entity_id}_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(entity_dir, unique_filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(upload_file.file.read())

    return file_path, unique_filename


@router.post("/{entity_type}/{entity_id}", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
def upload_attachment(
    entity_type: str,
    entity_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a file attachment for a specific entity.

    Args:
        entity_type: Type of entity (e.g., "discipline_event", "medical_event", "bakatz")
        entity_id: ID of the entity
        file: File to upload

    Returns:
        Created attachment record
    """
    # Validate file type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not allowed"
        )

    # Read file to check size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size {file_size} exceeds maximum {MAX_FILE_SIZE} bytes"
        )

    # Save file
    file_path, _ = _save_upload_file(file, entity_type, entity_id)

    # Create database record
    attachment = Attachment(
        file_name=file.filename or "unnamed",
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        entity_type=entity_type,
        entity_id=entity_id,
    )

    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return attachment


@router.get("/{entity_type}/{entity_id}", response_model=List[AttachmentList])
def list_attachments(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db),
):
    """
    List all attachments for a specific entity.

    Args:
        entity_type: Type of entity
        entity_id: ID of the entity

    Returns:
        List of attachments
    """
    attachments = (
        db.query(Attachment)
        .filter(Attachment.entity_type == entity_type, Attachment.entity_id == entity_id)
        .order_by(Attachment.uploaded_at.desc())
        .all()
    )
    return attachments


@router.get("/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
):
    """
    Download a specific attachment file.

    Args:
        attachment_id: ID of the attachment

    Returns:
        File response with the attachment
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()

    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )

    if not os.path.exists(attachment.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )

    return FileResponse(
        path=attachment.file_path,
        filename=attachment.file_name,
        media_type=attachment.mime_type,
    )


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a specific attachment.

    Args:
        attachment_id: ID of the attachment
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()

    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )

    # Delete file from disk
    if os.path.exists(attachment.file_path):
        try:
            os.remove(attachment.file_path)
        except OSError:
            pass  # Continue even if file deletion fails

    # Delete database record
    db.delete(attachment)
    db.commit()

    return None
