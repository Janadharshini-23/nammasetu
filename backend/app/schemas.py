from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    name: str
    email: str


class DocumentHelp(BaseModel):
    name: str
    how_to: str
    url: Optional[str] = None


class ApplyStep(BaseModel):
    title: str
    detail: str


class SchemeOut(BaseModel):
    id: int
    slug: str
    name: str
    ministry: Optional[str] = None
    level: str
    tags: List[str] = []
    summary: Optional[str] = None
    benefits: Optional[str] = None
    eligibility_text: Optional[str] = None
    documents: List[str] = []
    document_help: List[DocumentHelp] = []
    apply_url: Optional[str] = None

    class Config:
        from_attributes = True


class Profile(BaseModel):
    """User-supplied profile for eligibility matching. All fields optional."""
    age: Optional[int] = Field(default=None, ge=0, le=120)
    gender: Optional[str] = None            # female / male / other
    state: Optional[str] = None
    category: Optional[str] = None          # general / obc / sc / st / ews
    annual_income: Optional[int] = Field(default=None, ge=0)  # household income in INR
    occupation: Optional[str] = None        # student / farmer / self-employed / salaried / unemployed / artisan / street-vendor / other
    area: Optional[str] = None              # rural / urban
    disability: Optional[bool] = None
    minority: Optional[bool] = None
    lang: Optional[str] = "en"              # "en" or "hi", controls response language


class CriterionResult(BaseModel):
    label: str
    status: str      # met / not_met / unknown


class MatchResult(BaseModel):
    scheme: SchemeOut
    verdict: str                 # eligible / likely / not_eligible
    score: float                 # 0..1, fraction of checkable criteria met
    criteria: List[CriterionResult]


class EligibilityOut(BaseModel):
    eligible: List[MatchResult]
    likely: List[MatchResult]
    not_eligible_count: int


class SmartCheckOut(BaseModel):
    narrative: str
    used_llm: bool
    eligible: List[MatchResult]
    likely: List[MatchResult]
    not_eligible_count: int


class ChatIn(BaseModel):
    messages: List[dict]         # [{role, content}]
    profile: Optional[Profile] = None
    lang: Optional[str] = "en"


class ChatOut(BaseModel):
    reply: str
    used_llm: bool
    schemes: List[SchemeOut] = []
