from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ----------------------------------------------------
# Profile Schemas
# ----------------------------------------------------
class ProfileBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "fan"  # fan, volunteer, organizer
    preferences: Optional[dict] = None


class ProfileCreate(ProfileBase):
    id: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    preferences: Optional[dict] = None


class ProfileResponse(ProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Zone Schemas
# ----------------------------------------------------
class ZoneBase(BaseModel):
    name: str
    capacity: int
    current_crowd_count: int
    density_level: str  # low, medium, high, critical


class ZoneResponse(ZoneBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Facility Schemas
# ----------------------------------------------------
class FacilityBase(BaseModel):
    name: str
    type: str  # restroom, food, first_aid, merchandise, gate, accessibility
    zone_id: str
    is_accessible: bool
    status: str  # open, crowded, closed
    wait_time_minutes: int
    location_x: float
    location_y: float


class FacilityResponse(FacilityBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Incident Schemas
# ----------------------------------------------------
class IncidentBase(BaseModel):
    title: str
    description: str
    zone_id: str
    severity: str = "low"  # low, medium, high, critical
    status: str = "reported"  # reported, investigating, resolved, escalated


class IncidentCreate(BaseModel):
    title: str
    description: str
    zone_id: str
    severity: str = "low"


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    ai_summary: Optional[str] = None
    sop_steps: Optional[List[str]] = None


class IncidentResponse(IncidentBase):
    id: str
    reporter_id: Optional[str] = None
    ai_summary: Optional[str] = None
    sop_steps: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# VolunteerTask Schemas
# ----------------------------------------------------
class VolunteerTaskBase(BaseModel):
    title: str
    description: str
    assigned_to: str
    incident_id: Optional[str] = None
    status: str = "pending"  # pending, in_progress, completed


class VolunteerTaskCreate(BaseModel):
    title: str
    description: str
    assigned_to: str
    incident_id: Optional[str] = None


class VolunteerTaskUpdate(BaseModel):
    status: str  # pending, in_progress, completed


class VolunteerTaskResponse(VolunteerTaskBase):
    id: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# LiveAlert Schemas
# ----------------------------------------------------
class LiveAlertBase(BaseModel):
    title: str
    message: str
    target_role: str = "all"  # all, fan, volunteer, organizer
    zone_id: Optional[str] = None
    severity: str = "info"  # info, warning, critical
    expires_at: Optional[datetime] = None


class LiveAlertCreate(LiveAlertBase):
    pass


class LiveAlertResponse(LiveAlertBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# AI Chat & Utilities Schemas
# ----------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    role: str = "fan"  # fan, volunteer, organizer
    current_zone_id: Optional[str] = None
    seat: Optional[str] = None
    accessibility_requirements: Optional[List[str]] = Field(default_factory=list)
    preferred_language: str = "en"


class ChatResponse(BaseModel):
    response: str
    suggestions: List[str] = Field(default_factory=list)


class TranslationRequest(BaseModel):
    text: str
    target_language: str  # es, fr, de, pt, zh, ar, etc.


class TranslationResponse(BaseModel):
    translated_text: str


class AnnouncementCreate(BaseModel):
    event_context: str
    target_role: str = "all"  # all, fan, volunteer, organizer
    zone_id: Optional[str] = None
    tone: str = "informative"  # informative, urgent, welcoming
    language: str = "en"


class AnnouncementResponse(BaseModel):
    generated_text: str
