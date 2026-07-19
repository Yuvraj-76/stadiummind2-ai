import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/translate`, {
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

  // Mock translation — return original text with language prefix
  const targetLang = body.target_language || "unknown";
  return NextResponse.json({
    translated_text: `[${targetLang}] ${body.text || ""}`,
  });
}
