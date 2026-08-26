import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { runPromptJSON, getBigModel } from "@/lib/langchain";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import { extractText } from "unpdf";

export async function POST(request) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const file = formData.get("file");
  const jobPosition = formData.get("jobPosition") || "";
  const experience = formData.get("experience") || "0";
  const userEmail = formData.get("userEmail");
  const useSaved = formData.get("useSaved") === "true";

  if (!userEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Parse PDF or use saved resume text
  let resumeText = "";

  if (useSaved) {
    // Fetch saved resume text from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_text")
      .eq("email", userEmail)
      .single();

    if (!profile?.resume_text) {
      return NextResponse.json({ error: "No saved resume found. Please upload a PDF." }, { status: 400 });
    }
    resumeText = profile.resume_text;
  } else {
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const { text } = await extractText(uint8Array, { mergePages: true });
      resumeText = text?.trim();
    } catch (err) {
      console.error("PDF parse error:", err);
      return NextResponse.json({ error: `Failed to parse PDF: ${err.message}` }, { status: 400 });
    }

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json({ error: "Could not extract enough text from the resume. Make sure it's not a scanned image PDF." }, { status: 400 });
    }
  }

  // Truncate to avoid token limits
  const truncated = resumeText.slice(0, 4000);
  const questionCount = process.env.INTERVIEW_QUESTION_COUNT || 5;

  const roleHint = jobPosition
    ? `The candidate is applying for: ${jobPosition}.`
    : "Infer the most suitable job role from the resume.";

  const prompt = `You are a senior technical interviewer. Here is a candidate's resume:

---
${truncated}
---

${roleHint}
Years of experience stated or inferred: ${experience}.

Generate ${questionCount} highly specific interview questions based ONLY on what is in this resume.
Rules:
- Reference actual projects, companies, technologies, and timelines from the resume
- At least 2 questions should probe specific things they claimed (e.g. "You mentioned X — explain how you implemented it")
- At least 1 behavioral question grounded in their actual experience
- Each question should have a strong model answer

Return ONLY a valid JSON array with "question" and "answer" fields. No markdown, no explanation.`;

  let parsed;
  try {
    parsed = await runPromptJSON(prompt, "array", getBigModel());
  } catch (err) {
    console.error("Resume-based interview generation error:", err);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }

  const mockId = uuidv4();
  const finalRole = jobPosition || "Resume-based Interview";

  const { error } = await supabase.from("preptalk").insert({
    mockId,
    jsonMockResp: JSON.stringify(parsed),
    jobPosition: finalRole,
    jobDesc: `Resume-based: ${truncated.slice(0, 200)}…`,
    jobexperience: experience,
    createdBy: userEmail,
    createdAt: moment().format("DD-MM-yyyy"),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ mockId, role: finalRole, questionCount: parsed.length });
}
