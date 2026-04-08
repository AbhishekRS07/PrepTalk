import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { runPrompt } from "@/lib/langchain";
import { cleanJson } from "@/lib/utils";
import { tavily } from "@tavily/core";

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

// ── Step 1: Extract company / role / stack from JD ────────────────
async function extractJDMeta(jdText, manualCompany) {
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
  const meta = JSON.parse(cleanJson(raw));
  if (manualCompany) meta.company = manualCompany;
  return meta;
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

// ── Step 3: Synthesize unified question bank ──────────────────────
async function synthesizeQuestions(entries) {
  // entries: [{ meta, snippets, jd }]
  const companyNames = entries.map((e) => e.meta.company || "Unknown Company");

  const companySections = entries
    .map((e, i) => {
      const { company, role, seniority, techStack, keyTopics } = e.meta;
      const searchContext = e.snippets
        .slice(0, 5)
        .map((s, j) => `[Source ${j + 1}: ${s.title}]\n${s.content}`)
        .join("\n\n");
      return `--- Company ${i + 1}: ${company || "Unknown"} ---
Role: ${seniority} ${role}
Tech Stack: ${(techStack || []).join(", ")}
Key Topics: ${(keyTopics || []).join(", ")}
JD Summary: ${e.jd.slice(0, 1000)}
Real interview data:
${searchContext || "No web results — generate from JD."}`;
    })
    .join("\n\n");

  const isMulti = entries.length > 1;

  const prompt = `You are a senior interviewer helping a candidate who is applying to ${entries.length} ${isMulti ? "companies" : "company"} simultaneously.

${companySections}

Generate a unified question bank of ${isMulti ? "20-28" : "15"} high-quality interview questions.

${isMulti ? `Rules for multi-company mode:
- PRIORITIZE common questions: if a topic/skill is required by 2+ companies, make one well-crafted question and mark it as common
- Deduplicate aggressively: never repeat the same concept twice even if phrased differently
- Include at least 1 system design and 1 behavioral question
- Each question must list ALL companies it is relevant to in the "companies" array
- "isCommon" must be true if companies.length >= 2
- Still include 2-3 company-specific questions per company for unique requirements` : `Rules:
- Mix sourced questions (from web results) and JD-tailored questions
- Include at least 1 system design and 1 behavioral question`}

Reply ONLY with a valid JSON array. Each object must have:
{
  "question": "the question text",
  "answer": "detailed model answer (3-5 sentences)",
  "topic": "System Design | JavaScript | React | Node.js | Databases | DSA | Behavioral | DevOps | TypeScript | Python | or infer from context",
  "difficulty": "Easy | Medium | Hard",
  "sourced": true or false,
  "companies": ${isMulti ? `["CompanyA", "CompanyB"]  — list the exact company names this question is relevant to` : `["${companyNames[0] || "Company"}"]`},
  "isCommon": ${isMulti ? "true if companies.length >= 2, false otherwise" : "false"}
}

No markdown, no explanation. Just the JSON array.`;

  const raw = await runPrompt(prompt);
  return JSON.parse(cleanJson(raw, "array"));
}

// ── Route handler ─────────────────────────────────────────────────
export async function POST(req) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const body = await req.json();

  // Support both legacy single { jd, company } and new { companies: [{jd, company}] }
  let companiesInput;
  if (body.companies) {
    companiesInput = body.companies;
  } else {
    companiesInput = [{ jd: body.jd, company: body.company }];
  }

  if (!companiesInput.length) {
    return NextResponse.json({ error: "No companies provided." }, { status: 400 });
  }

  for (const c of companiesInput) {
    if (!c.jd || c.jd.trim().length < 50) {
      return NextResponse.json(
        { error: `Job description for ${c.company || "a company"} is too short.` },
        { status: 400 }
      );
    }
  }

  // Step 1: Extract meta for all JDs in parallel
  const metas = await Promise.all(
    companiesInput.map((c) =>
      extractJDMeta(c.jd, c.company?.trim() || undefined).catch(() => ({
        company: c.company || null,
        role: "Software Engineer",
        seniority: "Mid",
        techStack: [],
        keyTopics: [],
      }))
    )
  );

  // Step 2: Search web for all companies in parallel
  const allSnippets = await Promise.all(
    metas.map((meta) =>
      searchInterviewQuestions(meta.company, meta.role, meta.techStack).catch(() => [])
    )
  );

  // Step 3: Synthesize unified question bank
  const entries = metas.map((meta, i) => ({
    meta,
    snippets: allSnippets[i],
    jd: companiesInput[i].jd,
  }));

  let questions;
  try {
    questions = await synthesizeQuestions(entries);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate questions. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    companies: metas,
    questions,
    sourcedCount: allSnippets.flat().length,
  });
}
