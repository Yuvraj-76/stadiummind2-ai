import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/announcement`, {
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

  // Generate a mock announcement based on tone
  const tone = body.tone || "informative";
  const context = body.event_context || "stadium event";
  let generated = "";

  switch (tone) {
    case "urgent":
      generated = `⚠️ ATTENTION ALL ATTENDEES: Important update regarding ${context}. Please follow staff instructions and remain calm. Your safety is our top priority. Further updates will follow shortly.`;
      break;
    case "welcoming":
      generated = `🏟️ Welcome to the match! ${context}. We're thrilled to have you here today. Enjoy the atmosphere, explore our facilities, and don't hesitate to ask any volunteer for assistance. Let's make this an unforgettable experience!`;
      break;
    default:
      generated = `📢 Stadium Update: ${context}. Thank you for your attention and cooperation. For real-time updates, check the StadiumMind app or speak with any nearby volunteer.`;
  }

  return NextResponse.json({ generated_text: generated });
}
