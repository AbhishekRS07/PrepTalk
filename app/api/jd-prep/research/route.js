import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { runPrompt } from "@/lib/langchain";
import { cleanJson } from "@/lib/utils";
import { tavily } from "@tavily/core";

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

// ── Step 1: Extract company / role / stack from JD ────────────────
async function extractJDMeta(jdText) {
  const prompt = `Extract structured information from this job description. Reply ONLY with valid JSON, no markdown.

Job Description:
${jdText.slice(0, 3000)}

Return this exact JSON shape:
{
  "company": "company name or null if not found",
  "role": "job title",
  "seniority": "Junior | Mid | Senior | Staff | Lead | Principal",
  "techStack": ["tech1", "tech2"],
  "keyTopics": ["System Design", "React", "Node.js"]
}`;

  const raw = await runPrompt(prompt);
  return JSON.parse(cleanJson(raw));
}

// ── Step 2: Web search for real interview questions ───────────────
async function searchInterviewQuestions(company, role, techStack) {
  const safeCompany = company || "tech company";
  const safeRole = role || "software engineer";
  const topTech = (techStack || []).slice(0, 3).join(" ");

  const queries = [
    `${safeCompany} ${safeRole} interview questions`,
    `${safeCompany} technical interview experience questions asked`,
    `${safeCompany} ${topTech} interview questions Glassdoor Blind`,
  ];

  const results = await Promise.allSettled(
    queries.map((q) =>
      tavilyClient.search(q, {
        searchDepth: "basic",
        maxResults: 4,
        includeAnswer: false,
      })
    )
  );

  // Combine all result content
  const snippets = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      for (const res of r.value.results || []) {
        if (res.content) {
          snippets.push({
            source: res.url,
            title: res.title,
            content: res.content.slice(0, 800),
          });
        }
      }
    }
  }
  return snippets;
}

// ── Step 3: Synthesize question bank with LLM ─────────────────────
async function synthesizeQuestions(meta, snippets, jdText) {
  const { company, role, seniority, techStack, keyTopics } = meta;

  const searchContext = snippets
    .slice(0, 8)
    .map((s, i) => `[Source ${i + 1}: ${s.title} — ${s.source}]\n${s.content}`)
    .join("\n\n");

  const prompt = `You are a senior interviewer. Using the job description and real interview experiences found online, create a curated question bank for a candidate preparing for ${company ? `${company}'s` : "a"} ${seniority} ${role} role.

Job Description Summary:
${jdText.slice(0, 1500)}

Real interview experiences and questions found online:
${searchContext || "No specific results found — generate based on JD and role."}

Tech Stack: ${(techStack || []).join(", ")}
Key Topics: ${(keyTopics || []).join(", ")}

Generate 15 high-quality interview questions. Mix:
- Questions directly sourced or paraphrased from the search results (mark these as sourced)
- Questions tailored to the JD's specific requirements
- At least 2 system design questions if seniority is Senior/Staff/Lead
- At least 2 behavioral/situational questions

Reply ONLY with a valid JSON array. Each object must have:
{
  "question": "the question text",
  "answer": "detailed model answer (3-5 sentences)",
  "topic": "one of: System Design | JavaScript | React | Node.js | Databases | DSA | Behavioral | DevOps | TypeScript | Python | or infer from context",
  "difficulty": "Easy | Medium | Hard",
  "sourced": true or false (true if from search results, false if AI-generated from JD)
}

No markdown, no explanation. Just the JSON array.`;

  const raw = await runPrompt(prompt);
  return JSON.parse(cleanJson(raw, "array"));
}

// ── Route handler ─────────────────────────────────────────────────
export async function POST(req) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { jd, company: manualCompany } = await req.json();
  if (!jd || jd.trim().length < 50) {
    return NextResponse.json({ error: "Job description is too short." }, { status: 400 });
  }

  // Step 1: Extract meta
  let meta;
  try {
    meta = await extractJDMeta(jd);
    if (manualCompany) meta.company = manualCompany;
  } catch {
    meta = { company: manualCompany || null, role: "Software Engineer", seniority: "Mid", techStack: [], keyTopics: [] };
  }

  // Step 2: Search web
  let snippets = [];
  try {
    snippets = await searchInterviewQuestions(meta.company, meta.role, meta.techStack);
  } catch (err) {
    console.error("Tavily search error:", err.message);
    // Continue without web results — LLM will generate from JD only
  }

  // Step 3: Synthesize
  let questions;
  try {
    questions = await synthesizeQuestions(meta, snippets, jd);
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate questions. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    company: meta.company,
    role: meta.role,
    seniority: meta.seniority,
    techStack: meta.techStack,
    sourcedCount: snippets.length,
    questions,
  });
}
