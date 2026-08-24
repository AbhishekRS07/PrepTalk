#!/usr/bin/env node
// Feature smoke test — exercises every AI-backed API route through a real,
// cookie-authenticated session against a running dev server (localhost:3000
// by default). Creates a disposable test user via the service-role key, signs
// in through the same @supabase/ssr cookie flow the app itself uses, runs
// every feature end-to-end, then deletes the test user + its data.
//
// Usage: node scripts/smoke-test.mjs [baseUrl]

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Load .env manually (this script runs outside Next's own env loading) ──
function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawVal.replace(/^["']|["']$/g, "");
  }
}
loadEnv(join(ROOT, ".env"));

const BASE_URL = process.argv[2] || "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error("Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

// ── Minimal, byte-accurate single-page PDF with real extractable text ──
function buildMinimalPdf(text) {
  const escaped = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const header = "%PDF-1.4\n";
  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n";
  const obj4 = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
  const content = `BT /F1 11 Tf 72 720 Td (${escaped}) Tj ET`;
  const obj5 = `5 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream\nendobj\n`;

  const pad10 = (n) => String(n).padStart(10, "0");
  let offset = Buffer.byteLength(header);
  const offsets = [];
  for (const obj of [obj1, obj2, obj3, obj4, obj5]) {
    offsets.push(offset);
    offset += Buffer.byteLength(obj);
  }
  const xrefStart = offset;
  const xref =
    "xref\n0 6\n0000000000 65535 f \n" +
    offsets.map((o) => `${pad10(o)} 00000 n \n`).join("");
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const full = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
  return Buffer.from(full, "binary");
}

const RESUME_TEXT =
  "Jane Doe, Senior Backend Engineer at Acme Corp, 5 years experience with Node.js, " +
  "PostgreSQL and distributed systems. Built payment processing APIs handling millions " +
  "of transactions daily. Previously at Widget Inc as a Junior Developer working on " +
  "internal tooling with Python and Django.";

// ── Results tracking ──
const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const tag = ok ? "PASS" : "FAIL";
  console.log(`[${tag}] ${name}${detail ? " — " + detail : ""}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`Smoke test against ${BASE_URL}\n`);
  console.log("Note: Groq's on-demand tier caps this model at 8000 tokens/minute (prompt+completion,");
  console.log("combined across all calls). Pacing requests below to avoid tripping that ceiling, since");
  console.log("that's an account-level limit, not something this app's code controls.\n");

  // ── 1. Create disposable test user ──
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const testEmail = `smoketest+${Date.now()}@preptalk.local`;
  const testPassword = crypto.randomBytes(18).toString("base64url");
  let userId;

  try {
    const { data, error } = await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    record("Setup: create disposable test user", true, testEmail);
  } catch (err) {
    record("Setup: create disposable test user", false, err.message);
    console.error("\nCannot continue without a test user. Aborting.");
    process.exit(1);
  }

  // ── 2. Sign in through the real @supabase/ssr cookie flow ──
  const jar = new Map();
  const authClient = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (toSet) => toSet.forEach(({ name, value }) => jar.set(name, value)),
    },
  });

  try {
    const { error } = await authClient.auth.signInWithPassword({ email: testEmail, password: testPassword });
    if (error) throw error;
    record("Setup: sign in (cookie session)", true, `${jar.size} cookie(s)`);
  } catch (err) {
    record("Setup: sign in (cookie session)", false, err.message);
    await cleanup();
    process.exit(1);
  }

  const cookieHeader = [...jar.entries()].map(([n, v]) => `${n}=${encodeURIComponent(v)}`).join("; ");

  async function api(path, { method = "GET", json, form } = {}) {
    const headers = { Cookie: cookieHeader };
    let body;
    if (json) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(json);
    } else if (form) {
      body = form; // FormData — fetch sets its own content-type boundary
    }
    const res = await fetch(`${BASE_URL}${path}`, { method, headers, body });
    let data;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data };
  }

  // ── 3. Basic authenticated read (no AI involved) ──
  try {
    const { status, data } = await api(`/api/profile?email=${encodeURIComponent(testEmail)}`);
    if (status !== 200) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Auth: GET /api/profile", true, JSON.stringify(data));
  } catch (err) {
    record("Auth: GET /api/profile", false, err.message);
  }

  // ── 4. Claim a username (creates the profiles row future steps rely on) ──
  try {
    const username = `smoketest${Date.now()}`.slice(0, 20);
    const { status, data } = await api("/api/profile", { method: "POST", json: { email: testEmail, username } });
    if (status !== 200) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Feature: claim username (/api/profile POST)", true, data.username);
  } catch (err) {
    record("Feature: claim username (/api/profile POST)", false, err.message);
  }

  // ── 5. Mock interview generation ──
  let mockId;
  await sleep(6000);
  try {
    const { status, data } = await api("/api/interview/generate", {
      method: "POST",
      json: { jobPosition: "Backend Engineer", jobDesc: "Build APIs with Node.js and Postgres", jobExperience: "3", userEmail: testEmail },
    });
    if (status !== 200 || !data?.mockId) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    mockId = data.mockId;
    record("Feature: mock interview generation", true, `mockId=${mockId}`);
  } catch (err) {
    record("Feature: mock interview generation", false, err.message);
  }

  // ── 6. Answer rating ──
  await sleep(6000);
  try {
    const { status, data } = await api("/api/answer/save", {
      method: "POST",
      json: {
        mockIdRef: mockId || "smoketest-mock-id",
        question: "What is a closure in JavaScript?",
        correctAns: "A function bundled with references to its surrounding state.",
        userAns: "A function that remembers variables from its outer scope.",
        userEmail: testEmail,
      },
    });
    if (status !== 200 || !("rating" in data)) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Feature: answer rating", true, `rating=${data.rating}`);
  } catch (err) {
    record("Feature: answer rating", false, err.message);
  }

  // ── 7. Resume analysis (uploads a synthetic PDF, also saves resume_text) ──
  await sleep(8000);
  try {
    const pdfBytes = buildMinimalPdf(RESUME_TEXT);
    const form = new FormData();
    form.set("file", new Blob([pdfBytes], { type: "application/pdf" }), "resume.pdf");
    const { status, data } = await api("/api/resume/analyze", { method: "POST", form });
    if (status !== 200 || typeof data?.overallScore !== "number") throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Feature: resume analysis", true, `overallScore=${data.overallScore}`);
  } catch (err) {
    record("Feature: resume analysis", false, err.message);
  }

  // ── 8. Resume-based interview generation (reuses saved resume_text) ──
  await sleep(8000);
  try {
    const form = new FormData();
    form.set("useSaved", "true");
    form.set("userEmail", testEmail);
    form.set("jobPosition", "Backend Engineer");
    form.set("experience", "3");
    const { status, data } = await api("/api/resume/generate", { method: "POST", form });
    if (status !== 200 || !data?.mockId) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Feature: resume-based interview generation", true, `questions=${data.questionCount}`);
  } catch (err) {
    record("Feature: resume-based interview generation", false, err.message);
  }

  // ── 9. Roadmap generation ──
  await sleep(8000);
  try {
    const { status, data } = await api("/api/roadmap/generate", {
      method: "POST",
      json: { currentStatus: "2 years at a service company", targetRole: "Senior Backend Engineer at a product company" },
    });
    if (status !== 200 || !Array.isArray(data?.phases)) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Feature: roadmap generation", true, `phases=${data.phases.length}`);
  } catch (err) {
    record("Feature: roadmap generation", false, err.message);
  }

  // ── 10. Coding challenge generation (heaviest reasoning prompt — extra pacing) ──
  await sleep(15000);
  try {
    const { status, data } = await api("/api/challenges/generate", {
      method: "POST",
      json: { category: "OOP Design", level: "3" },
    });
    if (status !== 200 || !Array.isArray(data?.testCases)) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Feature: coding challenge generation", true, `testCases=${data.testCases.length}`);
  } catch (err) {
    record("Feature: coding challenge generation", false, err.message);
  }

  // ── 11. Behavioral question generation ──
  await sleep(15000);
  try {
    const { status, data } = await api("/api/behavioral/generate", {
      method: "POST",
      json: { category: "Conflict Resolution", role: "Backend Engineer", experience: "Mid-level (2-5 years)" },
    });
    if (status !== 200 || !data?.question) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Feature: behavioral question generation", true, data.question.slice(0, 60));
  } catch (err) {
    record("Feature: behavioral question generation", false, err.message);
  }

  // ── 12. Behavioral answer feedback (STAR) ──
  await sleep(6000);
  try {
    const { status, data } = await api("/api/behavioral/feedback", {
      method: "POST",
      json: {
        question: "Tell me about a time you disagreed with a teammate.",
        answer: "I disagreed with a teammate on architecture, so I scheduled a call, listened to their reasoning, and we landed on a hybrid approach that shipped on time.",
        category: "Conflict Resolution",
      },
    });
    if (status !== 200 || typeof data?.score !== "number") throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Feature: behavioral STAR feedback", true, `score=${data.score}`);
  } catch (err) {
    record("Feature: behavioral STAR feedback", false, err.message);
  }

  // ── 13. Q&A hint generation ──
  await sleep(6000);
  try {
    const { status, data } = await api("/api/questions/generate", {
      method: "POST",
      json: { prompt: "Give a one-sentence hint (no answer) for: What is the time complexity of binary search?" },
    });
    if (status !== 200 || !data?.text) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Feature: Q&A hint generation", true, data.text.slice(0, 60));
  } catch (err) {
    record("Feature: Q&A hint generation", false, err.message);
  }

  // ── 14. Live interview conversation turn ──
  await sleep(6000);
  try {
    const { status, data } = await api("/api/interview/converse", {
      method: "POST",
      json: {
        role: "Backend Engineer",
        experience: "3",
        techStack: "Node.js, Postgres",
        messages: [{ role: "user", content: "I think a closure is when a function remembers variables from its scope." }],
      },
    });
    if (status !== 200 || !data?.reply) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Feature: live interview conversation turn", true, data.reply.slice(0, 60));
  } catch (err) {
    record("Feature: live interview conversation turn", false, err.message);
  }

  // ── 15. Live interview debrief ──
  await sleep(6000);
  try {
    const { status, data } = await api("/api/interview/converse", {
      method: "POST",
      json: {
        action: "debrief",
        role: "Backend Engineer",
        experience: "3",
        techStack: "Node.js, Postgres",
        messages: [
          { role: "assistant", content: "Hi, let's start — what is a closure?" },
          { role: "user", content: "A function that remembers variables from its outer scope." },
          { role: "assistant", content: "Correct. That covers what I wanted to explore. Thank you for your time." },
        ],
      },
    });
    if (status !== 200 || typeof data?.debrief?.score !== "number") throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Feature: live interview debrief", true, `score=${data.debrief.score}`);
  } catch (err) {
    record("Feature: live interview debrief", false, err.message);
  }

  // ── 16. JD-based prep (Groq + Tavily search) ──
  await sleep(10000);
  try {
    const { status, data } = await api("/api/jd-prep/research", {
      method: "POST",
      json: {
        jd: "We are looking for a Backend Engineer with 3+ years experience in Node.js, PostgreSQL, and distributed systems to build and scale our payments API.",
        company: "Acme Corp",
      },
    });
    if (status !== 200 || !Array.isArray(data?.questions) || !data.questions.length) throw new Error(`status ${status}: ${JSON.stringify(data)}`);
    record("Feature: JD-based prep (research + synthesis)", true, `questions=${data.questions.length}, sourced=${data.sourcedCount}`);
  } catch (err) {
    record("Feature: JD-based prep (research + synthesis)", false, err.message);
  }

  await cleanup();

  // ── Summary ──
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  const failures = results.filter((r) => !r.ok);
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  - ${f.name}: ${f.detail}`);
    process.exitCode = 1;
  }

  async function cleanup() {
    try {
      await admin.from?.("userAnswer")?.delete?.().eq("userEmail", testEmail);
    } catch {}
    try { await admin.from("preptalk").delete().eq("createdBy", testEmail); } catch {}
    try { await admin.from("roadmap").delete().eq("email", testEmail); } catch {}
    try { await admin.from("profiles").delete().eq("email", testEmail); } catch {}
    if (userId) {
      try {
        await admin.auth.admin.deleteUser(userId);
        record("Cleanup: delete disposable test user", true);
      } catch (err) {
        record("Cleanup: delete disposable test user", false, err.message);
      }
    }
  }
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
