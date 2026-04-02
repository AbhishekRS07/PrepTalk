import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { runPrompt } from "@/lib/langchain";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import moment from "moment";

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
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

  await db.insert(UserAnswer).values({
    mockIdRef,
    question,
    correctAns,
    userAns,
    feedback: parsed?.feedback,
    rating,
    userEmail,
    createdAt: moment().format("DD-MM-yyyy"),
  });

  return NextResponse.json({ success: true, rating, feedback: parsed?.feedback });
}
