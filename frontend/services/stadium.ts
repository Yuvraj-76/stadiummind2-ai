const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// Interfaces
export interface Zone {
  id: string;
  name: string;
  capacity: number;
  current_crowd_count: number;
  density_level: "low" | "medium" | "high" | "critical";
}

export interface Facility {
  id: string;
  name: string;
  type: "restroom" | "food" | "first_aid" | "merchandise" | "gate" | "accessibility";
  zone_id: string;
  is_accessible: boolean;
  status: "open" | "crowded" | "closed";
  wait_time_minutes: number;
  location_x: number;
  location_y: number;
}

export interface Incident {
  id: string;
  reporter_id?: string;
  title: string;
  description: string;
  zone_id: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "reported" | "investigating" | "resolved" | "escalated";
  ai_summary?: string;
  sop_steps?: string[];
  created_at: string;
  updated_at: string;
}

export interface VolunteerTask {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  incident_id?: string;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
  completed_at?: string;
}

export interface LiveAlert {
  id: string;
  title: string;
  message: string;
  target_role: "all" | "fan" | "volunteer" | "organizer";
  zone_id?: string;
  severity: "info" | "warning" | "critical";
  created_at: string;
  expires_at?: string;
}

export interface ChatRequest {
  message: string;
  role: "fan" | "volunteer" | "organizer";
  current_zone_id?: string;
  seat?: string;
  accessibility_requirements?: string[];
  preferred_language?: string;
}

export interface ChatResponse {
  response: string;
  suggestions: string[];
}

export interface AnnouncementRequest {
  event_context: string;
  target_role: "all" | "fan" | "volunteer" | "organizer";
  zone_id?: string;
  tone: "informative" | "urgent" | "welcoming";
  language: string;
}

// API Service Functions
export async function fetchZones(): Promise<Zone[]> {
  const res = await fetch(`${BACKEND_URL}/api/zones`);
  if (!res.ok) throw new Error("Failed to fetch zones");
  return res.json();
}

export async function fetchFacilities(zoneId?: string, type?: string): Promise<Facility[]> {
  const params = new URLSearchParams();
  if (zoneId) params.append("zone_id", zoneId);
  if (type) params.append("facility_type", type);
  const qs = params.toString();

  const res = await fetch(`${BACKEND_URL}/api/facilities${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch facilities");
  return res.json();
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${BACKEND_URL}/api/incidents`);
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function reportIncident(
  title: string,
  description: string,
  zoneId: string,
  severity: string
): Promise<Incident> {
  const res = await fetch(`${BACKEND_URL}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, zone_id: zoneId, severity }),
  });
  if (!res.ok) throw new Error("Failed to report incident");
  return res.json();
}

export async function updateIncident(
  incidentId: string,
  updates: Partial<Incident>
): Promise<Incident> {
  const res = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update incident");
  return res.json();
}

export async function fetchTasks(assignedTo?: string): Promise<VolunteerTask[]> {
  const params = new URLSearchParams();
  if (assignedTo) params.append("assigned_to", assignedTo);
  const qs = params.toString();

  const res = await fetch(`${BACKEND_URL}/api/tasks${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function updateTaskStatus(taskId: string, status: string): Promise<VolunteerTask> {
  const res = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update task status");
  return res.json();
}

export async function fetchAlerts(role?: string): Promise<LiveAlert[]> {
  const params = new URLSearchParams();
  if (role) params.append("target_role", role);
  const qs = params.toString();

  const res = await fetch(`${BACKEND_URL}/api/alerts${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function createAlert(alert: Partial<LiveAlert>): Promise<LiveAlert> {
  const res = await fetch(`${BACKEND_URL}/api/alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alert),
  });
  if (!res.ok) throw new Error("Failed to create alert");
  return res.json();
}

export async function askCopilot(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to chat with copilot");
  return res.json();
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/ai/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target_language: targetLanguage }),
  });
  if (!res.ok) throw new Error("Failed to translate text");
  const data = await res.json();
  return data.translated_text;
}

export async function generateAnnouncement(req: AnnouncementRequest): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/ai/announcement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to generate announcement");
  const data = await res.json();
  return data.generated_text;
}
