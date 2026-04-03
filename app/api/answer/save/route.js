import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { runPrompt } from "@/lib/langchain";
import moment from "moment";

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mockIdRef, question, correctAns, userAns, userEmail } = await request.json();

  if (!mockIdRef || !question || !userAns) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const prompt = `Question: ${question}\nUser Answer: ${userAns}\n\nRate this answer out of 10 and give feedback for improvement in 3-5 lines. Reply ONLY in JSON with fields "rating" (number only, e.g. 7) and "feedback" (string).`;

  const raw = (await runPrompt(prompt))
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(raw);
  const rating = String(parsed?.rating).replace(/[^0-9.]/g, "") || "0";

  const { error } = await supabase.from("userAnswer").insert({
    mockId: mockIdRef,
    question,
    correctAns,
    userAns,
    feedback: parsed?.feedback,
    rating,
    userEmail,
    createdAt: moment().format("DD-MM-yyyy"),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, rating, feedback: parsed?.feedback });
}
