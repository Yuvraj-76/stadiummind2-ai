import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const body = await request.json();

  try {
    const res = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
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

  return NextResponse.json({
    id: taskId,
    title: "Updated Task",
    description: "",
    assigned_to: "mock-volunteer",
    incident_id: null,
    status: body.status || "pending",
    created_at: new Date().toISOString(),
    completed_at: body.status === "completed" ? new Date().toISOString() : null,
  });
}
