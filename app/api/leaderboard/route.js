import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all answers
  const { data: answers } = await supabase
    .from("userAnswer")
    .select("userEmail, rating, mockId");

  // Fetch all live interviews
  const { data: liveInterviews } = await supabase
    .from("liveInterview")
    .select("createdBy, score");

  // Fetch all profiles for usernames
  const { data: profiles } = await supabase
    .from("profiles")
    .select("email, username");

  const profileMap = {};
  for (const p of (profiles || [])) {
    profileMap[p.email] = p.username;
  }

  // Aggregate mock/resume scores per user
  const userStats = {};

  for (const ans of (answers || [])) {
    const r = parseFloat(ans.rating);
    if (isNaN(r) || !ans.userEmail) continue;
    if (!userStats[ans.userEmail]) userStats[ans.userEmail] = { ratings: [], liveSessions: 0, liveTotal: 0 };
    userStats[ans.userEmail].ratings.push(r);
  }

  // Aggregate live scores per user
  for (const li of (liveInterviews || [])) {
    const s = parseFloat(li.score);
    if (isNaN(s) || s === 0 || !li.createdBy) continue;
    if (!userStats[li.createdBy]) userStats[li.createdBy] = { ratings: [], liveSessions: 0, liveTotal: 0 };
    userStats[li.createdBy].liveSessions += 1;
    userStats[li.createdBy].liveTotal += s;
  }

  // Fetch session counts per user from preptalk
  const { data: interviews } = await supabase
    .from("preptalk")
    .select("createdBy");

  const sessionCount = {};
  for (const iv of (interviews || [])) {
    sessionCount[iv.createdBy] = (sessionCount[iv.createdBy] || 0) + 1;
  }

  // Build leaderboard rows
  const rows = Object.entries(userStats).map(([email, stats]) => {
    const allScores = [...stats.ratings];
    // Include live scores in combined avg
    for (let i = 0; i < stats.liveSessions; i++) {
      allScores.push(stats.liveTotal / stats.liveSessions);
    }
    const avg = allScores.length
      ? parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1))
      : 0;
    const totalSessions = (sessionCount[email] || 0) + stats.liveSessions;
    const username = profileMap[email] || null;
    const displayName = username
      ? username
      : email.split("@")[0].slice(0, 3) + "***";

    return { email, displayName, username, avg, totalSessions, answeredQuestions: stats.ratings.length };
  });

  // Sort: avg DESC, then totalSessions DESC as tie-breaker
  rows.sort((a, b) => b.avg - a.avg || b.totalSessions - a.totalSessions);

  // Add rank
  const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));

  return NextResponse.json(ranked);
}
