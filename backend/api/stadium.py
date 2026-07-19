from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from db.session import get_db
from models.stadium import Profile, Zone, Facility, Incident, VolunteerTask, LiveAlert
from schemas.stadium import (
    ProfileCreate,
    ProfileUpdate,
    ProfileResponse,
    ZoneResponse,
    FacilityResponse,
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
    VolunteerTaskCreate,
    VolunteerTaskUpdate,
    VolunteerTaskResponse,
    LiveAlertCreate,
    LiveAlertResponse,
    ChatRequest,
    ChatResponse,
    TranslationRequest,
    TranslationResponse,
    AnnouncementCreate,
    AnnouncementResponse,
)
from services.ai_service import AIService
from core.security import verify_token, require_role

router = APIRouter(prefix="/api", tags=["Stadium Operations"])


# ----------------------------------------------------
# Profile Endpoints
# ----------------------------------------------------
@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
def get_profile(profile_id: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return profile


@router.post("/profiles", response_model=ProfileResponse)
def create_or_update_profile(profile_data: ProfileCreate, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_data.id).first()
    if profile:
        profile.full_name = profile_data.full_name
        profile.role = profile_data.role
        profile.preferences = profile_data.preferences
    else:
        profile = Profile(
            id=profile_data.id,
            email=profile_data.email,
            full_name=profile_data.full_name,
            role=profile_data.role,
            preferences=profile_data.preferences,
        )
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


# ----------------------------------------------------
# Zone Endpoints
# ----------------------------------------------------
@router.get("/zones", response_model=List[ZoneResponse])
def list_zones(db: Session = Depends(get_db)):
    return db.query(Zone).all()


@router.get("/zones/{zone_id}", response_model=ZoneResponse)
def get_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found"
        )
    return zone


# ----------------------------------------------------
# Facility Endpoints
# ----------------------------------------------------
@router.get("/facilities", response_model=List[FacilityResponse])
def list_facilities(
    zone_id: Optional[str] = None,
    facility_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Facility)
    if zone_id:
        query = query.filter(Facility.zone_id == zone_id)
    if facility_type:
        query = query.filter(Facility.type == facility_type)
    return query.all()


# ----------------------------------------------------
# Incident Endpoints
# ----------------------------------------------------
@router.get("/incidents", response_model=List[IncidentResponse])
def list_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.created_at.desc()).all()


@router.post("/incidents", response_model=IncidentResponse)
def report_incident(incident_data: IncidentCreate, db: Session = Depends(get_db)):
    # 1. Verify zone exists
    zone = db.query(Zone).filter(Zone.id == incident_data.zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid stadium zone"
        )

    # 2. Call AI Service to auto-generate summary and SOP checklist
    ai_service = AIService(db)
    chat_req = ChatRequest(
        message=(
            f"An incident was reported: {incident_data.title}. Description: {incident_data.description}. "
            f"Generate a clear concise one-sentence AI summary, followed by a JSON checklist of standard operating procedures "
            f"for stadium volunteer responders."
        ),
        role="volunteer",
        current_zone_id=incident_data.zone_id,
    )
    ai_response = ai_service.chat_copilot(chat_req)

    # Simple backup parsing if JSON parsing fails
    ai_summary = f"Incident reported: {incident_data.title}. Operations team notified."
    sop_steps = [
        "Inspect the reported area immediately.",
        "Ensure spectator pathways remain clear.",
        "Alert stadium maintenance crew.",
        "Report completion back to Operations Command.",
    ]

    if "checklist" in ai_response.response.lower() or "sop" in ai_response.response.lower():
        ai_summary = ai_response.response.split("\n")[0].replace("📋", "").strip()
        # Parse simulated list items
        parsed_steps = []
        for line in ai_response.response.split("\n"):
            line_strip = line.strip()
            if line_strip.startswith(("-", "*", "1.", "2.", "3.", "4.", "5.")):
                parsed_steps.append(line_strip.lstrip("-*12345. ").strip())
        if parsed_steps:
            sop_steps = parsed_steps

    incident_id = f"inc-{str(uuid.uuid4())[:8]}"

    # Create the Incident record
    incident = Incident(
        id=incident_id,
        reporter_id="mock-volunteer",  # Assumed logged in reporter
        title=incident_data.title,
        description=incident_data.description,
        zone_id=incident_data.zone_id,
        severity=incident_data.severity,
        status="reported",
        ai_summary=ai_summary,
        sop_steps=sop_steps,
    )

    db.add(incident)

    # Auto-generate volunteer tasks based on SOP steps
    for idx, step in enumerate(sop_steps[:2]):  # Assign first two SOP steps as tasks
        task_id = f"task-{str(uuid.uuid4())[:8]}"
        task = VolunteerTask(
            id=task_id,
            title=step[:60],
            description=f"Action item for reported incident: {incident_data.title}. Task detail: {step}",
            assigned_to="mock-volunteer",
            incident_id=incident_id,
            status="pending",
        )
        db.add(task)

    db.commit()
    db.refresh(incident)
    return incident


@router.patch("/incidents/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: str, incident_data: IncidentUpdate, db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found"
        )

    if incident_data.status:
        incident.status = incident_data.status
    if incident_data.severity:
        incident.severity = incident_data.severity
    if incident_data.ai_summary:
        incident.ai_summary = incident_data.ai_summary
    if incident_data.sop_steps is not None:
        incident.sop_steps = incident_data.sop_steps

    db.commit()
    db.refresh(incident)
    return incident


# ----------------------------------------------------
# Volunteer Task Endpoints
# ----------------------------------------------------
@router.get("/tasks", response_model=List[VolunteerTaskResponse])
def list_tasks(assigned_to: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(VolunteerTask)
    if assigned_to:
        query = query.filter(VolunteerTask.assigned_to == assigned_to)
    return query.all()


@router.patch("/tasks/{task_id}", response_model=VolunteerTaskResponse)
def update_task_status(
    task_id: str, task_data: VolunteerTaskUpdate, db: Session = Depends(get_db)
):
    task = db.query(VolunteerTask).filter(VolunteerTask.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    task.status = task_data.status
    if task_data.status == "completed":
        from datetime import datetime
        task.completed_at = datetime.now()

    db.commit()
    db.refresh(task)
    return task


# ----------------------------------------------------
# Alert Endpoints
# ----------------------------------------------------
@router.get("/alerts", response_model=List[LiveAlertResponse])
def list_alerts(target_role: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(LiveAlert)
    if target_role:
        query = query.filter(
            (LiveAlert.target_role == "all") | (LiveAlert.target_role == target_role)
        )
    return query.order_by(LiveAlert.created_at.desc()).all()


@router.post("/alerts", response_model=LiveAlertResponse)
def create_alert(alert_data: LiveAlertCreate, db: Session = Depends(get_db)):
    alert_id = f"alert-{str(uuid.uuid4())[:8]}"
    alert = LiveAlert(
        id=alert_id,
        title=alert_data.title,
        message=alert_data.message,
        target_role=alert_data.target_role,
        zone_id=alert_data.zone_id,
        severity=alert_data.severity,
        expires_at=alert_data.expires_at,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


# ----------------------------------------------------
# AI Copilot Endpoints
# ----------------------------------------------------
@router.post("/ai/chat", response_model=ChatResponse)
def chat_with_copilot(request: ChatRequest, db: Session = Depends(get_db)):
    ai_service = AIService(db)
    return ai_service.chat_copilot(request)


@router.post("/ai/translate", response_model=TranslationResponse)
def translate_message(request: TranslationRequest, db: Session = Depends(get_db)):
    ai_service = AIService(db)
    translated = ai_service.translate_text(request.text, request.target_language)
    return TranslationResponse(translated_text=translated)


@router.post("/ai/announcement", response_model=AnnouncementResponse)
def generate_broadcasting_announcement(
    request: AnnouncementCreate, db: Session = Depends(get_db)
):
    ai_service = AIService(db)
    return ai_service.generate_announcement(request)
