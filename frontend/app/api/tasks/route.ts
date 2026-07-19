import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const mockTasks = [
  {
    id: "task-001",
    title: "Clear blocked exit near Gate C",
    description: "Deploy crowd control barriers and redirect foot traffic at Gate C emergency exit.",
    assigned_to: "mock-volunteer",
    incident_id: "inc-001",
    status: "in_progress",
    created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    completed_at: null,
  },
  {
    id: "task-002",
    title: "Notify stadium security command center",
    description: "Escalate Gate C blockage to security command center for additional support.",
    assigned_to: "mock-volunteer",
    incident_id: "inc-001",
    status: "pending",
    created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    completed_at: null,
  },
  {
    id: "task-003",
    title: "Dispatch first aid to Section 208",
    description: "Send nearest first aid responder to spectator reporting dizziness in Section 208.",
    assigned_to: "mock-volunteer",
    incident_id: "inc-002",
    status: "pending",
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    completed_at: null,
  },
  {
    id: "task-004",
    title: "Verify spill cleanup completion",
    description: "Confirm the concourse spill area is fully dry and signage removed.",
    assigned_to: "mock-volunteer",
    incident_id: "inc-003",
    status: "completed",
    created_at: new Date(Date.now() - 80 * 60000).toISOString(),
    completed_at: new Date(Date.now() - 65 * 60000).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assignedTo = searchParams.get("assigned_to");

  try {
    const backendUrl = new URL(`${BACKEND_URL}/api/tasks`);
    if (assignedTo) backendUrl.searchParams.append("assigned_to", assignedTo);

    const res = await fetch(backendUrl.toString(), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend unavailable
  }

  let filtered = mockTasks;
  if (assignedTo) filtered = filtered.filter((t) => t.assigned_to === assignedTo);

  return NextResponse.json(filtered);
}
