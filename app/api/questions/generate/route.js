import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { runPrompt } from "@/lib/langchain";

export async function POST(request) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  try {
    const text = await runPrompt(prompt);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Question generation error:", err);
    return NextResponse.json({ error: "Failed to generate hint. Please try again." }, { status: 500 });
  }
}
