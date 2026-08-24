import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Public client — no auth required, only reads shared data
let _supabase;
const getSupabase = () => {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return _supabase;
};

export async function GET(req, { params }) {
  const supabase = getSupabase();
  const { token } = params;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  // Find the interview by share token
  const { data: interview, error } = await supabase
    .from("preptalk")
    .select("mockId, jobPosition, jobExperience, jobDesc, jsonMockResp, createdAt")
    .eq("shareToken", token)
    .single();

  if (error || !interview) {
    return NextResponse.json({ error: "Not found or link has been disabled" }, { status: 404 });
  }

  // Fetch answers
  const { data: answers } = await supabase
    .from("userAnswer")
    .select("question, correctAns, userAns, feedback, rating")
    .eq("mockId", interview.mockId);

  // Parse original questions to merge skipped ones
  let allQuestions = [];
  try {
    const raw = interview.jsonMockResp;
    const cleaned = raw.replace(/^[^{[]*/, "").replace(/[^}\]]*$/, "").trim();
    const valid = cleaned.startsWith("[") ? cleaned : `[${cleaned}]`;
    allQuestions = JSON.parse(valid);
  } catch (_) {}

  const answerMap = {};
  for (const a of (answers || [])) answerMap[a.question] = a;

  const merged = allQuestions.length > 0
    ? allQuestions.map((q) => {
        const saved = answerMap[q.question];
        if (saved) return saved;
        return { question: q.question, correctAns: q.answer, userAns: null, feedback: null, rating: null, skipped: true };
      })
    : (answers || []);

  const answered = merged.filter((i) => !i.skipped && i.rating);
  const avgRating = answered.length
    ? parseFloat((answered.reduce((s, i) => s + parseFloat(i.rating), 0) / answered.length).toFixed(1))
    : 0;

  return NextResponse.json({
    role: interview.jobPosition,
    experience: interview.jobExperience,
    createdAt: interview.createdAt,
    avgRating,
    items: merged,
  });
}
