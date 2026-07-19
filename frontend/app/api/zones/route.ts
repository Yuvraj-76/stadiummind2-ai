import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

// Mock zones data for when the backend is unavailable
const mockZones = [
  { id: "zone-a", name: "North Stand", capacity: 15000, current_crowd_count: 11200, density_level: "high" },
  { id: "zone-b", name: "South Stand", capacity: 15000, current_crowd_count: 8400, density_level: "medium" },
  { id: "zone-c", name: "East Wing", capacity: 10000, current_crowd_count: 3200, density_level: "low" },
  { id: "zone-d", name: "West Wing", capacity: 10000, current_crowd_count: 7800, density_level: "medium" },
  { id: "zone-e", name: "VIP Lounge", capacity: 2000, current_crowd_count: 1850, density_level: "critical" },
  { id: "zone-f", name: "Fan Zone Plaza", capacity: 5000, current_crowd_count: 2100, density_level: "low" },
];

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/zones`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend unavailable, fall through to mock data
  }
  return NextResponse.json(mockZones);
}
