import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ incidentId: string }> }
) {
  const { incidentId } = await params;
  const body = await request.json();

  try {
    const res = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}`, {
      method: "PATCH",
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

  // Mock response
  return NextResponse.json({
    id: incidentId,
    status: body.status || "investigating",
    severity: body.severity || "medium",
    ai_summary: body.ai_summary || "Updated incident.",
    sop_steps: body.sop_steps || [],
    title: "Updated Incident",
    description: "",
    zone_id: "zone-a",
    reporter_id: "mock-volunteer",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
