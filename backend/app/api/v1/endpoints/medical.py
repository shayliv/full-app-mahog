from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
import json

from app.db.session import get_db
from app.models.medical import MedicalEvent as MedicalEventModel
from app.models.medical import MedicalProfile as MedicalProfileModel
from app.schemas import (
    MedicalEvent,
    MedicalEventCreate,
    MedicalEventUpdate,
    MedicalProfile,
    MedicalProfileCreate,
    MedicalProfileUpdate,
)


router = APIRouter()


@router.get("/profile", response_model=MedicalProfile)
def get_medical_profile(
    student_id: int, db: Session = Depends(get_db)
) -> MedicalProfile:
    profile = (
        db.query(MedicalProfileModel)
        .filter(MedicalProfileModel.student_id == student_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Medical profile not found")
    return MedicalProfile.from_orm(profile)


@router.post(
    "/profile", response_model=MedicalProfile, status_code=status.HTTP_201_CREATED
)
def create_medical_profile(
    student_id: int,
    profile_in: MedicalProfileCreate,
    db: Session = Depends(get_db),
) -> MedicalProfile:
    profile = MedicalProfileModel(student_id=student_id, **profile_in.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return MedicalProfile.from_orm(profile)


@router.put("/profile", response_model=MedicalProfile)
def update_medical_profile(
    student_id: int,
    profile_in: MedicalProfileUpdate,
    db: Session = Depends(get_db),
) -> MedicalProfile:
    profile = (
        db.query(MedicalProfileModel)
        .filter(MedicalProfileModel.student_id == student_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Medical profile not found")

    for field, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return MedicalProfile.from_orm(profile)


@router.get("/events", response_model=list[MedicalEvent])
def list_medical_events(
    student_id: int, db: Session = Depends(get_db)
) -> list[MedicalEvent]:
    events = (
        db.query(MedicalEventModel)
        .filter(MedicalEventModel.student_id == student_id)
        .order_by(MedicalEventModel.start_date.desc())
        .all()
    )
    return [MedicalEvent.from_orm(e) for e in events]


@router.post(
    "/events", response_model=MedicalEvent, status_code=status.HTTP_201_CREATED
)
def create_medical_event(
    student_id: int,
    event_in: MedicalEventCreate,
    db: Session = Depends(get_db),
) -> MedicalEvent:
    event = MedicalEventModel(student_id=student_id, **event_in.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return MedicalEvent.from_orm(event)


@router.put("/events/{event_id}", response_model=MedicalEvent)
def update_medical_event(
    student_id: int,
    event_id: int,
    event_in: MedicalEventUpdate,
    db: Session = Depends(get_db),
) -> MedicalEvent:
    event = (
        db.query(MedicalEventModel)
        .filter(
            MedicalEventModel.id == event_id,
            MedicalEventModel.student_id == student_id,
        )
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Medical event not found")

    for field, value in event_in.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    db.add(event)
    db.commit()
    db.refresh(event)
    return MedicalEvent.from_orm(event)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medical_event(
    student_id: int, event_id: int, db: Session = Depends(get_db)
) -> None:
    event = (
        db.query(MedicalEventModel)
        .filter(
            MedicalEventModel.id == event_id,
            MedicalEventModel.student_id == student_id,
        )
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Medical event not found")
    db.delete(event)
    db.commit()


@router.post("/documents", response_model=MedicalProfile)
async def upload_medical_document(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> MedicalProfile:
    """Upload a medical exemption document for a student."""
    profile = (
        db.query(MedicalProfileModel)
        .filter(MedicalProfileModel.student_id == student_id)
        .first()
    )

    if not profile:
        # Create profile if it doesn't exist
        profile = MedicalProfileModel(student_id=student_id)
        db.add(profile)
        db.flush()

    # Save file
    from pathlib import Path
    static_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / "static" / "uploads" / "medical"
    static_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    import uuid
    ext = Path(file.filename or "document").suffix
    filename = f"{student_id}_{uuid.uuid4()}{ext}"
    path = static_dir / filename

    contents = await file.read()
    path.write_bytes(contents)

    document_url = f"/static/uploads/medical/{filename}"

    # Update profile with document path
    if profile.exemption_documents_json:
        try:
            docs = json.loads(profile.exemption_documents_json)
        except:
            docs = []
    else:
        docs = []

    docs.append(document_url)
    profile.exemption_documents_json = json.dumps(docs)

    db.add(profile)
    db.commit()
    db.refresh(profile)

    # Parse exemption_documents for response
    exemption_docs = None
    if profile.exemption_documents_json:
        try:
            exemption_docs = json.loads(profile.exemption_documents_json)
        except:
            exemption_docs = None

    return MedicalProfile.from_orm(profile).model_copy(update={"exemption_documents": exemption_docs})

