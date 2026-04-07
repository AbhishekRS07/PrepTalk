import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { runPrompt } from "@/lib/langchain";
import { cleanJson } from "@/lib/utils";

export async function POST(req) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { category, role, experience } = await req.json();

  const prompt = `You are a senior behavioral interview coach. Generate a realistic behavioral interview question for the following context:

Category: ${category}
Target role: ${role || "Software Engineer"}
Experience level: ${experience || "Mid-level (2-5 years)"}

Return a JSON object (no markdown, no code block) with exactly these fields:
{
  "question": "The full behavioral question",
  "context": "One sentence explaining why companies ask this and what they're really evaluating",
  "starGuide": {
    "situation": "Specific guidance on what kind of situation to describe for this question",
    "task": "What responsibility or challenge to highlight",
    "action": "What specific actions and skills to showcase",
    "result": "What outcome metrics or impact to mention"
  },
  "tips": ["tip 1", "tip 2", "tip 3"],
  "redFlags": ["common mistake 1", "common mistake 2"],
  "exampleOpener": "A strong opening sentence to start the answer (just the opener, not the full answer)"
}`;

  try {
    const raw = await runPrompt(prompt);
    const parsed = JSON.parse(cleanJson(raw));
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Failed to generate question" }, { status: 500 });
  }
}
