import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getModel, getLiveModel } from "@/lib/langchain";
import { cleanJson } from "@/lib/utils";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

const SYSTEM_PROMPT = (role, experience, techStack) => `You are a senior technical interviewer conducting a live interview for a ${role} position.
The candidate has ${experience} year(s) of experience. Relevant tech stack: ${techStack}.

Rules:
- Ask ONE question at a time. Keep it concise.
- If the candidate's answer is vague, incomplete, or incorrect, probe with a smart follow-up (e.g. "Can you elaborate on X?", "What would happen if Y?").
- After a satisfactory answer, naturally transition to the next topic.
- Cover a mix of: conceptual understanding, problem-solving, past experience, and behavioral questions.
- After 8-12 exchanges total, wrap up naturally: "That covers what I wanted to explore. Thank you for your time."
- Do NOT number your questions or say "Question 1", "Question 2" etc.
- Do NOT give feedback or rate the candidate mid-interview. Stay in character as an interviewer.
- Keep your responses short — 1-3 sentences max unless explaining something.
- Start by introducing yourself briefly and asking the first question.`;

const DEBRIEF_PROMPT = (role, experience, techStack, conversation) => `You conducted a live mock interview for a ${role} role (${experience} yr exp, stack: ${techStack}).

Here is the full conversation:
${conversation}

Now generate a structured debrief as a JSON object with exactly this shape:
{
  "overallBand": "string (e.g. 'Good', 'Average', 'Excellent', 'Needs Work')",
  "score": number between 1-10,
  "summary": "2-3 sentence overall summary",
  "strengths": ["string", "string", "string"],
  "improvements": ["string", "string", "string"],
  "topicBreakdown": [
    { "topic": "string", "rating": "Strong|Average|Weak", "note": "short note" }
  ]
}
Return ONLY valid JSON. No markdown, no explanation.`;

export async function POST(request) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { messages, role, experience, techStack, action } = await request.json();

  // Generate debrief
  if (action === "debrief") {
    const conversation = messages
      .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
      .join("\n");

    // Retry once on malformed JSON — gpt-oss-120b occasionally emits a stray comma or
    // unescaped quote; identical prompts succeed on retry (confirmed live).
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await getModel().invoke([
          new SystemMessage("You are an expert interview coach."),
          new HumanMessage(DEBRIEF_PROMPT(role, experience, techStack, conversation)),
        ]);
        const debrief = JSON.parse(cleanJson(res.content.trim()));
        return NextResponse.json({ debrief });
      } catch (err) {
        lastErr = err;
      }
    }
    console.error("Debrief generation error:", lastErr);
    return NextResponse.json({ error: "Failed to generate debrief" }, { status: 500 });
  }

  // Normal conversation turn — low reasoning effort keeps replies snappy for live back-and-forth.
  const langchainMessages = [
    new SystemMessage(SYSTEM_PROMPT(role, experience, techStack)),
    ...messages.map((m) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ];

  try {
    const res = await getLiveModel().invoke(langchainMessages);
    return NextResponse.json({ reply: res.content });
  } catch (err) {
    console.error("Live interview reply error:", err);
    return NextResponse.json({ error: "Failed to get interviewer reply" }, { status: 500 });
  }
}
