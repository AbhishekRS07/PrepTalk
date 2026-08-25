import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { runPromptJSON } from "@/lib/langchain";

export async function POST(req) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { question, answer, category } = await req.json();
  if (!question || !answer) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const prompt = `You are an expert behavioral interview coach. Evaluate this answer using the STAR framework.

Question: ${question}
Category: ${category || "General"}
Candidate's Answer: ${answer}

Return a JSON object (no markdown, no code block) with exactly these fields:
{
  "score": <integer 1-10>,
  "starBreakdown": {
    "situation": { "present": true/false, "quality": "strong/weak/missing", "comment": "brief feedback" },
    "task": { "present": true/false, "quality": "strong/weak/missing", "comment": "brief feedback" },
    "action": { "present": true/false, "quality": "strong/weak/missing", "comment": "brief feedback" },
    "result": { "present": true/false, "quality": "strong/weak/missing", "comment": "brief feedback" }
  },
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "improvedAnswer": "A rewritten version of their answer that demonstrates a strong STAR response (2-4 sentences)",
  "verdict": "One punchy sentence summarising the overall quality"
}`;

  try {
    const parsed = await runPromptJSON(prompt);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Behavioral feedback error:", err);
    return NextResponse.json({ error: "Failed to evaluate answer" }, { status: 500 });
  }
}
