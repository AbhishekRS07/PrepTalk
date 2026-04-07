import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

function parseDate(str) {
  if (!str) return null;
  // "DD-MM-YYYY" format
  const [dd, mm, yyyy] = str.split("-");
  const d = new Date(`${yyyy}-${mm}-${dd}`);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(date) {
  return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const email = user.email;

  // Only count sessions with at least one answer (mock/resume)
  // and live interviews with a score > 0
  const [{ data: answers }, { data: liveInterviews }] = await Promise.all([
    supabase.from("userAnswer").select("mockId, createdAt").eq("userEmail", email),
    supabase.from("liveInterview").select("createdAt").eq("createdBy", email).gt("score", 0),
  ]);

  // Collect all unique activity dates
  const dateSet = new Set();

  for (const ans of (answers || [])) {
    const d = parseDate(ans.createdAt);
    if (d) dateSet.add(toDateKey(d));
  }
  for (const li of (liveInterviews || [])) {
    const d = new Date(li.createdAt);
    d.setHours(0, 0, 0, 0);
    dateSet.add(toDateKey(d));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Streak ──────────────────────────────────────────────────────
  let streak = 0;
  const check = new Date(today);

  // If no activity today, start checking from yesterday
  if (!dateSet.has(toDateKey(check))) {
    check.setDate(check.getDate() - 1);
  }

  while (dateSet.has(toDateKey(check))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }

  // ── This week's sessions (Mon–today) ────────────────────────────
  // Count unique mockIds answered this week (each interview = 1 session)
  const monday = getMondayOfWeek(today);
  const weekMockIds = new Set();
  for (const ans of (answers || [])) {
    const d = parseDate(ans.createdAt);
    if (d && d >= monday && d <= today) weekMockIds.add(ans.mockId || ans.createdAt);
  }
  let weekSessions = weekMockIds.size;
  for (const li of (liveInterviews || [])) {
    const d = new Date(li.createdAt);
    d.setHours(0, 0, 0, 0);
    if (d >= monday && d <= today) weekSessions++;
  }

  // ── Last session (days ago) ──────────────────────────────────────
  let lastSessionDaysAgo = null;
  if (dateSet.size > 0) {
    const sorted = [...dateSet].sort().reverse();
    const lastDate = new Date(sorted[0]);
    lastDate.setHours(0, 0, 0, 0);
    lastSessionDaysAgo = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));
  }

  // ── Total sessions ───────────────────────────────────────────────
  // Count unique mock interviews with at least one answer
  const uniqueMockIds = new Set((answers || []).map((a) => a.mockId).filter(Boolean));
  const totalSessions = uniqueMockIds.size + (liveInterviews?.length || 0);

  return NextResponse.json({
    streak,
    weekSessions,
    lastSessionDaysAgo,
    totalSessions,
    activeDays: dateSet.size,
  });
}
