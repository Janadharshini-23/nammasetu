from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey, DateTime, UniqueConstraint, Boolean
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Scheme(Base):
    __tablename__ = "schemes"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(160), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    name_hi = Column(String(255))
    name_ta = Column(String(255))
    name_te = Column(String(255))
    ministry = Column(String(255))
    level = Column(String(40), default="Central")          # Central / State
    tags = Column(JSON, default=list)                       # e.g. ["education","scholarship"]
    summary = Column(Text)                                  # one-paragraph description
    summary_hi = Column(Text)
    summary_ta = Column(Text)
    summary_te = Column(Text)
    benefits = Column(Text)                                 # what the person receives
    benefits_hi = Column(Text)
    benefits_ta = Column(Text)
    benefits_te = Column(Text)
    eligibility_text = Column(Text)                         # human-readable eligibility
    eligibility_text_hi = Column(Text)
    eligibility_text_ta = Column(Text)
    eligibility_text_te = Column(Text)
    rules = Column(JSON, default=dict)                      # machine-readable rules (see eligibility.py)
    documents = Column(JSON, default=list)                  # required documents
    documents_hi = Column(JSON, default=list)
    documents_ta = Column(JSON, default=list)
    documents_te = Column(JSON, default=list)
    apply_url = Column(String(500))                         # official application link
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SavedScheme(Base):
    __tablename__ = "saved_schemes"
    __table_args__ = (UniqueConstraint("user_id", "scheme_id", name="uq_user_scheme"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ApplicationTrack(Base):
    """User-maintained record of a submitted scheme application."""
    __tablename__ = "application_tracks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    scheme_name = Column(String(255), nullable=False)       # free-text (user may not be on our DB)
    scheme_slug = Column(String(160), nullable=True)        # optional link back to our scheme
    application_number = Column(String(120), nullable=False)
    applied_date = Column(String(20), nullable=True)        # ISO date string "YYYY-MM-DD"
    tracking_url = Column(String(500), nullable=True)       # official portal URL
    # Status: one of pending / under_review / approved / rejected / disbursed / manual
    status = Column(String(40), default="pending")
    status_source = Column(String(20), default="manual")    # "manual" only (no auto-API available)
    status_note = Column(Text, nullable=True)               # user's own notes
    # Timeline: list of {date, status, note} dicts, user-maintained
    timeline = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

