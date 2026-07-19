import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
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

  // Intelligent mock responses based on user message
  const message = (body.message || "").toLowerCase();
  let response = "";
  let suggestions: string[] = [];

  if (message.includes("restroom") || message.includes("bathroom") || message.includes("toilet")) {
    response = "🚻 The nearest restroom is **North Restroom A** in Zone A — currently open with only a 3-minute wait. There's also South Restroom in Zone B (2 min wait). North Restroom B is crowded right now (12 min wait), so I'd skip that one!";
    suggestions = ["Food with short lines", "Where is my seat?", "First aid station"];
  } else if (message.includes("seat") || message.includes("section")) {
    response = "🪑 To find your seat, head through **Gate A (Main Entrance)** and follow the signage for your section. Ushers are posted at each entry point to help guide you. If you need wheelchair access, the Wheelchair Assistance Point is in Zone C.";
    suggestions = ["Nearest restroom", "Food options", "Accessibility help"];
  } else if (message.includes("food") || message.includes("eat") || message.includes("hungry") || message.includes("drink")) {
    response = "🍔 Here are your best food options right now:\n\n• **Taco Corner** (Zone B) — 5 min wait ✅\n• **Pizza Point** (Zone D) — 8 min wait\n• **Burger Stand** (Zone A) — 15 min wait (crowded)\n\nI'd recommend Taco Corner for the quickest service!";
    suggestions = ["Nearest restroom", "Where is my seat?", "Merch store"];
  } else if (message.includes("merch") || message.includes("shop") || message.includes("souvenir")) {
    response = "🛍️ The **Official Merch Store** is in Zone C (East Wing). It's currently crowded with about a 20-minute wait. Pro tip: Try visiting during the second half for shorter lines!";
    suggestions = ["Food options", "Nearest restroom", "First aid station"];
  } else if (message.includes("first aid") || message.includes("medical") || message.includes("help") || message.includes("emergency")) {
    response = "🏥 First aid stations are available at:\n\n• **First Aid Station North** (Zone A) — open, no wait\n• **First Aid Station South** (Zone B) — open, no wait\n\nFor emergencies, alert any nearby staff member or volunteer immediately.";
    suggestions = ["Nearest restroom", "Where is my seat?", "Food options"];
  } else if (message.includes("accessible") || message.includes("wheelchair") || message.includes("disability")) {
    response = "♿ The **Wheelchair Assistance Point** is located in Zone C. Accessible restrooms are available at North Restroom A (Zone A) and South Restroom (Zone B). Gate A and Gate B both have wheelchair-accessible entrances.";
    suggestions = ["First aid station", "Nearest restroom", "Food options"];
  } else {
    response = `Thanks for your question! I'm your StadiumAssist Copilot 🏟️. I can help with:\n\n• Finding restrooms, food, or first aid\n• Navigating to your seat\n• Wait time updates\n• Accessibility information\n\nWhat would you like to know?`;
    suggestions = ["Nearest restroom", "Food with short lines", "Where is my seat?"];
  }

  return NextResponse.json({ response, suggestions });
}
