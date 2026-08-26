import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { runPromptJSON, getBigModel } from "@/lib/langchain";
import { rateLimitOrResponse } from "@/lib/rateLimit";

export async function POST(req) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const limited = await rateLimitOrResponse(user.email, "roadmap-generate", 10, 300);
  if (limited) return limited;

  const { currentStatus, targetRole } = await req.json();
  if (!currentStatus || !targetRole)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const prompt = `You are an expert interview coach. Generate a personalized interview preparation roadmap for someone who is "${currentStatus}" and is targeting to become a "${targetRole}".

Return ONLY a valid JSON object — no markdown, no explanation. Use this exact structure:

{
  "phases": [
    {
      "id": "phase-1",
      "title": "Phase title",
      "description": "One sentence describing this phase",
      "emoji": "🔍",
      "milestones": [
        {
          "id": "m1",
          "title": "Milestone title",
          "description": "2-3 sentences explaining what to do and why it matters",
          "tasks": ["Specific actionable task 1", "Specific actionable task 2", "Specific actionable task 3"],
          "appAction": {
            "label": "Open [Feature Name]",
            "path": "/dashboard/jd-prep",
            "hint": "How to use this specific PrepTalk feature for this milestone"
          },
          "estimatedDays": 2,
          "tip": "One pro tip specific to this milestone and role"
        }
      ]
    }
  ]
}

IMPORTANT rules:
- Total milestones across ALL phases must be between 5 and 10 — choose whatever number genuinely fits this person's journey, no more, no less.
- Number of phases and milestones per phase should feel natural for this specific person — a fresher may need more steps than an experienced professional switching roles.
- Do NOT pad with unnecessary milestones just to hit a number.
- Each milestone must be meaningfully different and actionable.
- Milestone IDs must be unique strings: "m1", "m2", ..., up to "m10".

Available PrepTalk features and their paths:
- Mock Interview (role-specific Q&A): path = "/dashboard" (tell user to click "Mock Interview" card)
- Live AI Interviewer (conversational): path = "/dashboard/live-interview"
- Resume-based Interview: path = "/dashboard/resume-interview"
- JD Prep (job description analysis + questions): path = "/dashboard/jd-prep"
- Interview Q&A Bank: path = "/dashboard/questions"
- DSA Practice + IDE: path = "/dashboard/questions" (tell user to switch to DSA tab)
- Analytics (track progress): path = "/dashboard/analytics"

Map each milestone to the single most relevant PrepTalk feature. Make tasks highly specific to what a "${targetRole}" interview looks like, and calibrated to the gap between their current level ("${currentStatus}") and the target. Consider the skill gap — a service company employee targeting a product role needs different preparation than someone already in a product company.`;

  let roadmap;
  try {
    roadmap = await runPromptJSON(prompt, undefined, getBigModel());
  } catch (err) {
    console.error("Roadmap generation error:", err);
    return NextResponse.json({ error: "Failed to generate roadmap. Please try again." }, { status: 500 });
  }

  // Save to DB (upsert — one roadmap per user)
  await supabase.from("roadmap").upsert({
    email: user.email,
    current_status: currentStatus,
    target_role: targetRole,
    phases: roadmap.phases,
    completed_ids: [],
    updated_at: new Date().toISOString(),
  }, { onConflict: "email" });

  return NextResponse.json(roadmap);
}
