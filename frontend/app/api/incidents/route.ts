import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const mockIncidents = [
  {
    id: "inc-001",
    reporter_id: "vol-user-01",
    title: "Blocked emergency exit – Gate C",
    description: "Crowd overflow has partially blocked the emergency exit near Gate C. Immediate clearance required.",
    zone_id: "zone-c",
    severity: "high",
    status: "investigating",
    ai_summary: "Emergency exit blockage at Gate C due to crowd overflow. Security and volunteer teams dispatched for clearance.",
    sop_steps: [
      "Secure area and redirect foot traffic",
      "Deploy crowd control barriers",
      "Notify stadium security command center",
      "Confirm exit is fully cleared and operational",
    ],
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: "inc-002",
    reporter_id: "vol-user-02",
    title: "Medical assistance needed – Section 208",
    description: "A spectator in Section 208 reports dizziness and needs medical attention.",
    zone_id: "zone-b",
    severity: "medium",
    status: "reported",
    ai_summary: "Spectator medical incident in Section 208. First aid team alerted.",
    sop_steps: [
      "Dispatch nearest first aid responder",
      "Clear surrounding seating for access",
      "Monitor patient condition and escalate if needed",
    ],
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 60000).toISOString(),
  },
  {
    id: "inc-003",
    reporter_id: "vol-user-01",
    title: "Spill hazard in concourse walkway",
    description: "Large drink spill creating a slip hazard in the main concourse near food stands.",
    zone_id: "zone-a",
    severity: "low",
    status: "resolved",
    ai_summary: "Spill hazard cleaned and resolved in main concourse area.",
    sop_steps: [
      "Place wet floor signage",
      "Notify custodial team for cleanup",
      "Verify surface is dry before removing signage",
    ],
    created_at: new Date(Date.now() - 90 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 60000).toISOString(),
  },
];

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/incidents`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend unavailable
  }
  return NextResponse.json(mockIncidents);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend unavailable
  }

  // Mock response for new incident
  const body = await request.text().then((t) => { try { return JSON.parse(t); } catch { return {}; } }).catch(() => ({}));
  const newIncident = {
    id: `inc-${Date.now().toString(36)}`,
    reporter_id: "mock-volunteer",
    title: body.title || "New Incident",
    description: body.description || "",
    zone_id: body.zone_id || "zone-a",
    severity: body.severity || "medium",
    status: "reported",
    ai_summary: `Incident reported: ${body.title || "New Incident"}. Operations team notified.`,
    sop_steps: [
      "Inspect the reported area immediately.",
      "Ensure spectator pathways remain clear.",
      "Alert stadium maintenance crew.",
      "Report completion back to Operations Command.",
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return NextResponse.json(newIncident, { status: 201 });
}
