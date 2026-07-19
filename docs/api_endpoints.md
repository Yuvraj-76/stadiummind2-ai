# API Endpoint Documentation — StadiumMind AI 🛰️

All APIs communicate via standard JSON payloads. The server runs by default on `http://127.0.0.1:8000`.

---

## 1. System Endpoints

### Health Check
Returns the API service version, status, and server time.
- **Method**: `GET`
- **Path**: `/health`
- **Response**:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2026-07-17T01:30:00.123456+00:00"
}
```

---

## 2. Stadium Data Endpoints

### List Zones
Retrieve a list of all stadium stands, capacities, and live density levels.
- **Method**: `GET`
- **Path**: `/api/zones`
- **Response**:
```json
[
  {
    "id": "zone-a",
    "name": "North Concourse (Gate A & B)",
    "capacity": 8000,
    "current_crowd_count": 1200,
    "density_level": "low"
  }
]
```

### List Facilities
Retrieve all facilities with optional zone and type filters.
- **Method**: `GET`
- **Path**: `/api/facilities`
- **Parameters**: `zone_id` (optional string), `facility_type` (optional string)
- **Response**:
```json
[
  {
    "id": "restroom-a1",
    "name": "Restroom Block North A",
    "type": "restroom",
    "zone_id": "zone-a",
    "is_accessible": true,
    "status": "open",
    "wait_time_minutes": 3,
    "location_x": 25.0,
    "location_y": 15.0
  }
]
```

---

## 3. Operations & Safety Endpoints

### List Incidents
Fetch all active and resolved tournament incidents.
- **Method**: `GET`
- **Path**: `/api/incidents`
- **Response**:
```json
[
  {
    "id": "incident-1",
    "reporter_id": "mock-volunteer",
    "title": "Water Leakage Near Gate C",
    "description": "A major pipe leak is causing wet floors...",
    "zone_id": "zone-b",
    "severity": "medium",
    "status": "investigating",
    "ai_summary": "Water pipe leak detected near Gate C...",
    "sop_steps": ["Deploy wet floor warning signs", "Redirect traffic..."],
    "created_at": "2026-07-16T18:15:00",
    "updated_at": "2026-07-16T18:45:00"
  }
]
```

### Report Incident
Create a new operational incident. This triggers AI SOP generation and creates volunteer sub-tasks automatically.
- **Method**: `POST`
- **Path**: `/api/incidents`
- **Payload**:
```json
{
  "title": "Scanner Freeze",
  "description": "Scanner lanes are frozen due to connection issue.",
  "zone_id": "zone-a",
  "severity": "medium"
}
```
- **Response**: Returns the created incident containing `ai_summary` and list of `sop_steps`.

### Update Incident Status
- **Method**: `PATCH`
- **Path**: `/api/incidents/{incident_id}`
- **Payload**: `{ "status": "resolved" }`

### List Volunteer Tasks
- **Method**: `GET`
- **Path**: `/api/tasks`
- **Parameters**: `assigned_to` (optional string)

### Update Task Status
- **Method**: `PATCH`
- **Path**: `/api/tasks/{task_id}`
- **Payload**: `{ "status": "completed" }`

---

## 4. AI Copilot Endpoints

### AI Copilot Chat
Interactive chat supporting Fans, Volunteers, and Organizers.
- **Method**: `POST`
- **Path**: `/api/ai/chat`
- **Payload**:
```json
{
  "message": "Where is the nearest restroom?",
  "role": "fan",
  "current_zone_id": "zone-a",
  "accessibility_requirements": ["wheelchair"],
  "preferred_language": "en"
}
```
- **Response**:
```json
{
  "response": "🚻 In North Concourse, the nearest restroom is Restroom Block North A. It is wheelchair accessible and currently has a 3-minute wait.",
  "suggestions": ["Route to this restroom", "Filter accessible only"]
}
```

### Instant Translation
Translate spectator queries for volunteer communication.
- **Method**: `POST`
- **Path**: `/api/ai/translate`
- **Payload**:
```json
{
  "text": "where is the restroom?",
  "target_language": "es"
}
```
- **Response**: `{ "translated_text": "¿Dónde está el baño?" }`

### Public Announcement Generator
Generate PA scripts for Command Centre broadcasts.
- **Method**: `POST`
- **Path**: `/api/ai/announcement`
- **Payload**:
```json
{
  "event_context": "scanner delay at gate g",
  "target_role": "all",
  "tone": "urgent",
  "language": "en"
}
```
- **Response**: `{ "generated_text": "⚠️ URGENT ANNOUNCEMENT: Attention fans at West Stand..." }`
