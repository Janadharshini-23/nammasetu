from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Scheme, SavedScheme, User
from ..schemas import SchemeOut
from ..auth import get_current_user
from ..serializers import scheme_to_out

router = APIRouter(prefix="/api/schemes", tags=["schemes"])


@router.get("", response_model=List[SchemeOut])
def list_schemes(
    q: Optional[str] = Query(default=None, max_length=120),
    tag: Optional[str] = Query(default=None, max_length=40),
    lang: str = Query(default="en"),
    db: Session = Depends(get_db),
):
    query = db.query(Scheme)
    if q:
        like = f"%{q.strip()}%"
        # Search across both languages so switching to Hindi doesn't break search.
        query = query.filter(or_(
            Scheme.name.ilike(like), Scheme.summary.ilike(like), Scheme.benefits.ilike(like),
            Scheme.name_hi.ilike(like), Scheme.summary_hi.ilike(like), Scheme.benefits_hi.ilike(like),
        ))
    schemes = query.order_by(Scheme.name).all()
    if tag:
        schemes = [s for s in schemes if tag.lower() in [t.lower() for t in (s.tags or [])]]
    return [scheme_to_out(s, lang) for s in schemes]


@router.get("/tags", response_model=List[str])
def list_tags(db: Session = Depends(get_db)):
    tags = set()
    for s in db.query(Scheme).all():
        tags.update(s.tags or [])
    return sorted(tags)


@router.get("/saved", response_model=List[SchemeOut])
def saved_schemes(lang: str = Query(default="en"), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(SavedScheme).filter(SavedScheme.user_id == user.id).all()
    ids = [r.scheme_id for r in rows]
    schemes = db.query(Scheme).filter(Scheme.id.in_(ids)).all() if ids else []
    return [scheme_to_out(s, lang) for s in schemes]


@router.get("/{slug}", response_model=SchemeOut)
def get_scheme(slug: str, lang: str = Query(default="en"), db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.slug == slug).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme_to_out(scheme, lang)


@router.post("/{slug}/save", status_code=201)
def save_scheme(slug: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.slug == slug).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    exists = db.query(SavedScheme).filter_by(user_id=user.id, scheme_id=scheme.id).first()
    if not exists:
        db.add(SavedScheme(user_id=user.id, scheme_id=scheme.id))
        db.commit()
    return {"saved": True}


@router.delete("/{slug}/save")
def unsave_scheme(slug: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.slug == slug).first()
    if scheme:
        db.query(SavedScheme).filter_by(user_id=user.id, scheme_id=scheme.id).delete()
        db.commit()
    return {"saved": False}
