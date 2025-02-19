import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_API_KEY is missing in .env.local");
      return NextResponse.json({ error: "API key is missing" }, { status: 500 });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }] // ✅ Correct request format
      }),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(`Gemini API Error: ${response.status} - ${errorMessage}`);
      return NextResponse.json({ error: "Failed to fetch response from Gemini API" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
