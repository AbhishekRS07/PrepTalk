import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { runPromptJSON } from "@/lib/langchain";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";

export async function POST(request) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { jobPosition, jobDesc, jobExperience, userEmail } = await request.json();

  if (!jobPosition || !jobDesc || !jobExperience || !userEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const questionCount = process.env.INTERVIEW_QUESTION_COUNT || 5;

  const prompt = `Job position: ${jobPosition}, Job Description: ${jobDesc}, Years of Experience: ${jobExperience}. Depending upon the job position, job description, and the years of experience, generate ${questionCount} interview questions along with the answers in JSON format. Provide "question" and "answer" fields in JSON.`;

  let cleaned;
  try {
    cleaned = JSON.stringify(await runPromptJSON(prompt));
  } catch (err) {
    console.error("Interview generation error:", err);
    return NextResponse.json({ error: "Failed to generate interview questions. Please try again." }, { status: 500 });
  }

  const mockId = uuidv4();

  const { error } = await supabase.from("preptalk").insert({
    mockId,
    jsonMockResp: cleaned,
    jobPosition,
    jobDesc,
    jobexperience: jobExperience,
    createdBy: userEmail,
    createdAt: moment().format("DD-MM-yyyy"),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mockId });
}
