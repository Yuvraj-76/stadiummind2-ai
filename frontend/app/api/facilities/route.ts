import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

// Mock facilities data for when the backend is unavailable
const mockFacilities = [
  { id: "fac-001", name: "North Restroom A", type: "restroom", zone_id: "zone-a", is_accessible: true, status: "open", wait_time_minutes: 3, location_x: 120, location_y: 80 },
  { id: "fac-002", name: "North Restroom B", type: "restroom", zone_id: "zone-a", is_accessible: false, status: "crowded", wait_time_minutes: 12, location_x: 180, location_y: 80 },
  { id: "fac-003", name: "South Restroom", type: "restroom", zone_id: "zone-b", is_accessible: true, status: "open", wait_time_minutes: 2, location_x: 120, location_y: 320 },
  { id: "fac-004", name: "Burger Stand", type: "food", zone_id: "zone-a", is_accessible: true, status: "crowded", wait_time_minutes: 15, location_x: 60, location_y: 140 },
  { id: "fac-005", name: "Taco Corner", type: "food", zone_id: "zone-b", is_accessible: false, status: "open", wait_time_minutes: 5, location_x: 200, location_y: 260 },
  { id: "fac-006", name: "Pizza Point", type: "food", zone_id: "zone-d", is_accessible: true, status: "open", wait_time_minutes: 8, location_x: 340, location_y: 200 },
  { id: "fac-007", name: "First Aid Station North", type: "first_aid", zone_id: "zone-a", is_accessible: true, status: "open", wait_time_minutes: 0, location_x: 100, location_y: 50 },
  { id: "fac-008", name: "First Aid Station South", type: "first_aid", zone_id: "zone-b", is_accessible: true, status: "open", wait_time_minutes: 0, location_x: 100, location_y: 350 },
  { id: "fac-009", name: "Official Merch Store", type: "merchandise", zone_id: "zone-c", is_accessible: true, status: "crowded", wait_time_minutes: 20, location_x: 380, location_y: 100 },
  { id: "fac-010", name: "Gate A – Main Entrance", type: "gate", zone_id: "zone-a", is_accessible: true, status: "open", wait_time_minutes: 4, location_x: 10, location_y: 200 },
  { id: "fac-011", name: "Gate B – South Entrance", type: "gate", zone_id: "zone-b", is_accessible: true, status: "open", wait_time_minutes: 2, location_x: 10, location_y: 300 },
  { id: "fac-012", name: "Wheelchair Assistance Point", type: "accessibility", zone_id: "zone-c", is_accessible: true, status: "open", wait_time_minutes: 0, location_x: 350, location_y: 150 },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zoneId = searchParams.get("zone_id");
  const facilityType = searchParams.get("facility_type");

  try {
    const backendUrl = new URL(`${BACKEND_URL}/api/facilities`);
    if (zoneId) backendUrl.searchParams.append("zone_id", zoneId);
    if (facilityType) backendUrl.searchParams.append("facility_type", facilityType);

    const res = await fetch(backendUrl.toString(), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend unavailable, fall through to mock data
  }

  let filtered = mockFacilities;
  if (zoneId) filtered = filtered.filter((f) => f.zone_id === zoneId);
  if (facilityType) filtered = filtered.filter((f) => f.type === facilityType);

  return NextResponse.json(filtered);
}
