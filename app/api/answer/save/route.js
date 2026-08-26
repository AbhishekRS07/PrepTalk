import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { runPromptJSON } from "@/lib/langchain";
import { rateLimitOrResponse } from "@/lib/rateLimit";
import moment from "moment";

export async function POST(request) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const limited = await rateLimitOrResponse(user.email, "answer-save", 20, 300);
  if (limited) return limited;

  const { mockIdRef, question, correctAns, userAns } = await request.json();

  if (!mockIdRef || !question || !userAns) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const prompt = `Question: ${question}\nUser Answer: ${userAns}\n\nRate this answer out of 10 and give feedback for improvement in 3-5 lines. Reply ONLY in JSON with fields "rating" (number only, e.g. 7) and "feedback" (string).`;

  let rating = "0";
  let feedback = "";

  try {
    const parsed = await runPromptJSON(prompt);
    rating = String(parsed?.rating).replace(/[^0-9.]/g, "") || "0";
    feedback = parsed?.feedback || "";
  } catch (err) {
    console.error("Groq rating error:", err);
    // Continue saving even if rating fails
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
