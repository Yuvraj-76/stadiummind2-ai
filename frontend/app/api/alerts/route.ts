import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const mockAlerts = [
  {
    id: "alert-001",
    title: "Halftime Break Starting",
    message: "Halftime break is now underway. Concessions and restrooms may experience higher traffic. Plan ahead!",
    target_role: "all",
    zone_id: null,
    severity: "info",
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
  },
  {
    id: "alert-002",
    title: "Heavy Crowd – North Stand",
    message: "North Stand (Zone A) is experiencing heavy crowd density. Consider using South Stand facilities for shorter wait times.",
    target_role: "fan",
    zone_id: "zone-a",
    severity: "warning",
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    expires_at: null,
  },
  {
    id: "alert-003",
    title: "VIP Lounge Near Capacity",
    message: "VIP Lounge is approaching maximum capacity. Staff should prepare for overflow management.",
    target_role: "organizer",
    zone_id: "zone-e",
    severity: "critical",
    created_at: new Date(Date.now() - 3 * 60000).toISOString(),
    expires_at: null,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetRole = searchParams.get("target_role");

  try {
    const backendUrl = new URL(`${BACKEND_URL}/api/alerts`);
    if (targetRole) backendUrl.searchParams.append("target_role", targetRole);

    const res = await fetch(backendUrl.toString(), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend unavailable
  }

  let filtered = mockAlerts;
  if (targetRole) {
    filtered = filtered.filter(
      (a) => a.target_role === "all" || a.target_role === targetRole
    );
  }

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const res = await fetch(`${BACKEND_URL}/api/alerts`, {
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

  return NextResponse.json(
    {
      id: `alert-${Date.now().toString(36)}`,
      title: body.title || "New Alert",
      message: body.message || "",
      target_role: body.target_role || "all",
      zone_id: body.zone_id || null,
      severity: body.severity || "info",
      created_at: new Date().toISOString(),
      expires_at: body.expires_at || null,
    },
    { status: 201 }
  );
}
