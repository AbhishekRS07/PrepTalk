import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { runPrompt } from "@/lib/langchain";
import { cleanJson } from "@/lib/utils";
import { extractText } from "unpdf";

export async function POST(req) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const formData = await req.formData();
  const file = formData.get("file");
  const jobDescription = formData.get("jobDescription") || "";
  const useSaved = formData.get("useSaved") === "true";

  let resumeText = "";

  if (useSaved) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_text")
      .eq("email", user.email)
      .single();
    if (!profile?.resume_text) {
      return NextResponse.json({ error: "No saved resume found. Please upload a PDF." }, { status: 400 });
    }
    resumeText = profile.resume_text;
  } else {
    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });
      resumeText = text?.trim();
    } catch (err) {
      return NextResponse.json({ error: `Failed to parse PDF: ${err.message}` }, { status: 400 });
    }
    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json({ error: "Could not extract text. Make sure the PDF is not a scanned image." }, { status: 400 });
    }
    // Save resume text for reuse
    await supabase.from("profiles")
      .update({ resume_text: resumeText })
      .eq("email", user.email);
  }

  const truncated = resumeText.slice(0, 4000);
  const jdSection = jobDescription
    ? `\nJob Description to match against:\n---\n${jobDescription.slice(0, 1500)}\n---`
    : "";

  const prompt = `You are an expert ATS (Applicant Tracking System) analyst and career coach. Analyze this resume${jobDescription ? " against the provided job description" : ""}.

Resume:
---
${truncated}
---
${jdSection}

Return a JSON object (no markdown, no code block) with exactly these fields:
{
  "overallScore": <integer 0-100>,
  "atsScore": <integer 0-100, how well the resume passes automated parsing>,
  "relevanceScore": <integer 0-100, how well it matches the JD — if no JD provided, set to null>,
  "sections": {
    "contactInfo": { "score": <0-100>, "status": "good/needs_work/missing", "feedback": "brief feedback" },
    "summary": { "score": <0-100>, "status": "good/needs_work/missing", "feedback": "brief feedback" },
    "experience": { "score": <0-100>, "status": "good/needs_work/missing", "feedback": "brief feedback" },
    "skills": { "score": <0-100>, "status": "good/needs_work/missing", "feedback": "brief feedback" },
    "education": { "score": <0-100>, "status": "good/needs_work/missing", "feedback": "brief feedback" },
    "formatting": { "score": <0-100>, "status": "good/needs_work/missing", "feedback": "brief feedback" }
  },
  "keyStrengths": ["strength 1", "strength 2", "strength 3"],
  "criticalIssues": ["issue 1", "issue 2"],
  "missingKeywords": ${jobDescription ? '["keyword missing from resume but in JD"]' : "[]"},
  "presentKeywords": ${jobDescription ? '["important keyword found in both"]' : "[]"},
  "improvements": [
    { "priority": "high/medium/low", "section": "which section", "suggestion": "specific actionable suggestion" }
  ],
  "rewrittenSummary": "A rewritten professional summary that would be more impactful (2-3 sentences)",
  "verdict": "One sentence overall assessment"
}`;

  try {
    const raw = await runPrompt(prompt);
    const parsed = JSON.parse(cleanJson(raw));
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Resume analysis error:", err);
    return NextResponse.json({ error: "Failed to analyze resume" }, { status: 500 });
  }
}
