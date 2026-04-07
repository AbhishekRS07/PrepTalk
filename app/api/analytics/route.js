import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  // ── Fetch mock/resume interviews ──────────────────────────────────
  const { data: interviews, error: iErr } = await supabase
    .from("preptalk")
    .select("mockId, jobPosition, jobDesc, createdAt")
    .eq("createdBy", email)
    .order("id", { ascending: true });

  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  // ── Fetch answers ─────────────────────────────────────────────────
  const { data: answers, error: aErr } = await supabase
    .from("userAnswer")
    .select("mockId, rating, createdAt")
    .eq("userEmail", email);

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  // ── Fetch live interviews ─────────────────────────────────────────
  const { data: liveInterviews, error: lErr } = await supabase
    .from("liveInterview")
    .select("mockId, role, score, createdAt, messages, debrief")
    .eq("createdBy", email)
    .order("id", { ascending: true });

  if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 });

  const hasAnyData = interviews?.length || liveInterviews?.length;
  if (!hasAnyData) {
    return NextResponse.json({
      totalInterviews: 0, totalQuestions: 0, overallAvg: 0,
      improvement: 0, trend: [], byRole: [], byType: [], recent: [],
    });
  }

  // ── Build mock/resume sessions ────────────────────────────────────
  const sessionMap = {};
  for (const iv of (interviews || [])) {
    const isResume = iv.jobDesc?.startsWith("Resume-based:");
    sessionMap[iv.mockId] = {
      role: iv.jobPosition,
      date: iv.createdAt,
      ratings: [],
      type: isResume ? "resume" : "mock",
    };
  }
  for (const ans of (answers || [])) {
    const r = parseFloat(ans.rating);
    if (sessionMap[ans.mockId] && !isNaN(r)) {
      sessionMap[ans.mockId].ratings.push(r);
    }
  }

  const mockSessions = Object.entries(sessionMap)
    .filter(([, s]) => s.ratings.length > 0)
    .map(([mockId, s]) => ({
      mockId,
      role: s.role,
      date: s.date,
      avg: parseFloat((s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length).toFixed(1)),
      count: s.ratings.length,
      type: s.type,
    }));

  // ── Build live sessions ───────────────────────────────────────────
  const liveSessions = (liveInterviews || [])
    .filter((li) => li.score > 0)
    .map((li) => ({
      mockId: li.mockId,
      role: li.role,
      date: li.createdAt,
      avg: parseFloat(li.score),
      count: (li.messages || []).filter((m) => m.role === "user").length,
      type: "live",
    }));

  // ── All sessions combined (sorted by date) ────────────────────────
  const allSessions = [...mockSessions, ...liveSessions].sort((a, b) => {
    // Both dates are in "DD-MM-YYYY" format
    const parse = (d) => {
      const [dd, mm, yyyy] = d.split("-");
      return new Date(`${yyyy}-${mm}-${dd}`).getTime();
    };
    return parse(a.date) - parse(b.date);
  });

  // ── Totals ────────────────────────────────────────────────────────
  const allRatings = (answers || []).map((a) => parseFloat(a.rating)).filter((r) => !isNaN(r));
  const liveScores = liveSessions.map((s) => s.avg);
  const combinedScores = [...allRatings, ...liveScores];

  const overallAvg = combinedScores.length
    ? parseFloat((combinedScores.reduce((a, b) => a + b, 0) / combinedScores.length).toFixed(1))
    : 0;

  const totalInterviews = (interviews?.length || 0) + (liveInterviews?.length || 0);
  const totalQuestions =
    allRatings.length +
    liveSessions.reduce((sum, s) => sum + s.count, 0);

  // ── Trend ─────────────────────────────────────────────────────────
  const trend = allSessions.map((s) => ({
    date: s.date,
    avg: s.avg,
    type: s.type,
    mockId: s.mockId,
    role: s.role,
  }));

  // ── Improvement ───────────────────────────────────────────────────
  let improvement = 0;
  if (allSessions.length >= 2) {
    const half = Math.max(1, Math.floor(allSessions.length / 2));
    const first = allSessions.slice(0, Math.min(3, half));
    const last  = allSessions.slice(-Math.min(3, half));
    const firstAvg = first.reduce((a, b) => a + b.avg, 0) / first.length;
    const lastAvg  = last.reduce((a, b) => a + b.avg, 0) / last.length;
    improvement = firstAvg > 0
      ? parseFloat((((lastAvg - firstAvg) / firstAvg) * 100).toFixed(1))
      : 0;
  }

  // ── By role ───────────────────────────────────────────────────────
  const roleMap = {};
  for (const s of allSessions) {
    if (!roleMap[s.role]) roleMap[s.role] = { total: 0, count: 0 };
    roleMap[s.role].total += s.avg;
    roleMap[s.role].count += 1;
  }
  const byRole = Object.entries(roleMap).map(([role, v]) => ({
    role: role.length > 18 ? role.slice(0, 16) + "…" : role,
    avg: parseFloat((v.total / v.count).toFixed(1)),
    sessions: v.count,
  }));

  // ── By type ───────────────────────────────────────────────────────
  const typeStats = { mock: { count: 0, total: 0 }, live: { count: 0, total: 0 }, resume: { count: 0, total: 0 } };
  for (const s of allSessions) {
    typeStats[s.type].count += 1;
    typeStats[s.type].total += s.avg;
  }
  const byType = [
    { type: "Mock", label: "Mock Interviews", count: typeStats.mock.count, avg: typeStats.mock.count ? parseFloat((typeStats.mock.total / typeStats.mock.count).toFixed(1)) : 0, color: "#8b5cf6" },
    { type: "Live", label: "Live Interviews", count: typeStats.live.count, avg: typeStats.live.count ? parseFloat((typeStats.live.total / typeStats.live.count).toFixed(1)) : 0, color: "#10b981" },
    { type: "Resume", label: "Resume-based", count: typeStats.resume.count, avg: typeStats.resume.count ? parseFloat((typeStats.resume.total / typeStats.resume.count).toFixed(1)) : 0, color: "#f59e0b" },
  ].filter((t) => t.count > 0);

  // ── Recent (last 5 across all types) ─────────────────────────────
  const recent = [...allSessions].reverse().slice(0, 5).map((s) => ({
    mockId: s.mockId,
    role: s.role,
    date: s.date,
    avg: s.avg,
    questions: s.count,
    type: s.type,
  }));

  return NextResponse.json({
    totalInterviews,
    totalQuestions,
    overallAvg,
    improvement,
    trend,
    byRole,
    byType,
    recent,
  });
}
