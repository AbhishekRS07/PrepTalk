import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { runPromptJSON } from "@/lib/langchain";
import { rateLimitOrResponse } from "@/lib/rateLimit";
import moment from "moment";

// The model consistently floors non-answers at 3/10 instead of ~0 (verified live:
// "I don't know" scored 3/10 across four unrelated questions, with LLM-generated
// feedback correctly identifying the answer as content-free) — a calibration bias, not
// something a prompt tweak alone reliably fixes. Catch the unambiguous cases
// deterministically instead of trusting the model's judgment for them.
const NON_ANSWER_PHRASES = /^(i\s*(do\s*not|don'?t)\s*know|idk|no\s*idea|not\s*sure|n\/?a|skip(ped)?|pass)$/i;
const PUNCTUATION_ONLY = /^[.\-!?\s]+$/;

function isNonAnswer(text) {
  const trimmed = text.trim();
  if (PUNCTUATION_ONLY.test(trimmed)) return true;
  return NON_ANSWER_PHRASES.test(trimmed.toLowerCase().replace(/[.!?]+$/, ""));
}

export async function POST(request) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const limited = await rateLimitOrResponse(user.email, "answer-save", 20, 300);
  if (limited) return limited;

  const { mockIdRef, question, correctAns, userAns } = await request.json();

  if (!mockIdRef || !question || !userAns) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let rating = "0";
  let feedback = "";

  if (isNonAnswer(userAns)) {
    feedback = "No real attempt was made — even a partial or uncertain answer scores higher than skipping the question.";
  } else {
    const prompt = `Question: ${question}\nUser Answer: ${userAns}\n\nRate this answer out of 10 using this rubric — use the full range, don't default to a "safe middle" score:
- 0-1: No real attempt, or completely wrong/irrelevant
- 2-4: Attempts the question but is significantly incomplete, vague, or incorrect
- 5-6: Partially correct with real gaps or shallow depth
- 7-8: Solid, mostly correct, shows real understanding
- 9-10: Excellent, thorough, technically precise

Give feedback for improvement in 3-5 lines. Reply ONLY in JSON with fields "rating" (number only, e.g. 7) and "feedback" (string).`;

    try {
      const parsed = await runPromptJSON(prompt);
      rating = String(parsed?.rating).replace(/[^0-9.]/g, "") || "0";
      feedback = parsed?.feedback || "";
    } catch (err) {
      console.error("Groq rating error:", err);
      // Continue saving even if rating fails
    }
  }

  const { error } = await supabase.from("userAnswer").insert({
    mockId: mockIdRef,
    question,
    correctAns,
    userAns,
    feedback,
    rating,
    userEmail: user.email,
    createdAt: moment().format("DD-MM-yyyy"),
  });

  if (error) {
    console.error("DB insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, rating, feedback });
}
