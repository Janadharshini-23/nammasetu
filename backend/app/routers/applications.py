from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import ApplicationTrack, User
from ..schemas import ApplicationTrackIn, ApplicationTrackOut, ApplicationTrackUpdate

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("", response_model=List[ApplicationTrackOut])
def list_applications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(ApplicationTrack)
        .filter(ApplicationTrack.user_id == user.id)
        .order_by(ApplicationTrack.created_at.desc())
        .all()
    )


@router.post("", response_model=ApplicationTrackOut, status_code=201)
def create_application(
    body: ApplicationTrackIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    initial_status = "pending"
    application = ApplicationTrack(
        user_id=user.id,
        scheme_name=body.scheme_name.strip(),
        scheme_slug=body.scheme_slug,
        application_number=body.application_number.strip(),
        applied_date=body.applied_date,
        tracking_url=body.tracking_url,
        status=initial_status,
        status_source="manual",
        status_note=body.status_note,
        timeline=[{
            "date": date.today().isoformat(),
            "status": initial_status,
            "note": body.status_note or "Application record created",
            "source": "manual",
        }],
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.patch("/{application_id}", response_model=ApplicationTrackOut)
def update_application(
    application_id: int,
    body: ApplicationTrackUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = (
        db.query(ApplicationTrack)
        .filter(ApplicationTrack.id == application_id, ApplicationTrack.user_id == user.id)
        .first()
    )
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    changes = body.model_dump(exclude_unset=True)
    changes.pop("timeline_entry", None)
    status_changed = "status" in changes and changes["status"] != application.status
    for field, value in changes.items():
        setattr(application, field, value)

    if status_changed:
        application.status_source = "manual"
        timeline = list(application.timeline or [])
        timeline.append({
            "date": date.today().isoformat(),
            "status": application.status,
            "note": application.status_note,
            "source": "manual",
        })
        application.timeline = timeline

    db.commit()
    db.refresh(application)
    return application


@router.delete("/{application_id}", status_code=204)
def delete_application(
    application_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = (
        db.query(ApplicationTrack)
        .filter(ApplicationTrack.id == application_id, ApplicationTrack.user_id == user.id)
        .first()
    )
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(application)
    db.commit()