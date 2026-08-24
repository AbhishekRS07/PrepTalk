import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

let _supabaseAdmin;
const getSupabaseAdmin = () => {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _supabaseAdmin;
};

// ── Helpers ───────────────────────────────────────────────────────

function parseDate(str) {
  if (!str) return null;
  const [dd, mm, yyyy] = str.split("-");
  return new Date(`${yyyy}-${mm}-${dd}`);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function scoreColor(avg) {
  if (avg >= 7.5) return "#10b981";
  if (avg >= 5)   return "#f59e0b";
  return "#ef4444";
}

function motivationalLine(sessions, avg, streak) {
  if (streak >= 7) return `🔥 ${streak}-day streak! You're on a serious run — keep it going.`;
  if (sessions === 0) return "You haven't practiced this week — even one session makes a difference!";
  if (avg >= 8)       return "Outstanding work this week. You're in top form! 🔥";
  if (avg >= 6.5)     return "Solid week! Keep the momentum going and you'll ace your next interview.";
  if (sessions >= 3)  return "Great consistency! More reps = more confidence. You're building something real.";
  return "Every practice session compounds. Keep showing up — you're getting better.";
}

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Email HTML ────────────────────────────────────────────────────

function buildEmail({ username, email, weekSessions, weekAvg, allTimeAvg, improvement,
  recentSessions, streak, roadmapPct, nextInterview, appUrl, unsubUrl }) {

  const displayName = username || email.split("@")[0];
  const hasActivity = weekSessions > 0;

  const recentRows = recentSessions.slice(0, 3).map((s) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1f2937;font-size:14px;color:#d1d5db;">${s.role}</td>
      <td style="padding:10px 0;border-bottom:1px solid #1f2937;font-size:14px;color:${scoreColor(s.avg)};font-weight:700;text-align:right;">${s.avg}/10</td>
    </tr>`).join("");

  const streakBlock = streak > 0 ? `
    <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;">🔥</span>
      <div>
        <p style="margin:0;font-size:18px;font-weight:800;color:#f97316;">${streak}-day streak</p>
        <p style="margin:2px 0 0;font-size:12px;color:#71717a;">Keep practicing daily to maintain it</p>
      </div>
    </div>` : "";

  const roadmapBlock = roadmapPct !== null ? `
    <div style="margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Roadmap Progress</p>
      <div style="background:#1f2937;border-radius:100px;height:8px;overflow:hidden;">
        <div style="background:linear-gradient(90deg,#39f2a0,#10b981);height:100%;width:${roadmapPct}%;border-radius:100px;"></div>
      </div>
      <p style="margin:6px 0 0;font-size:12px;color:#71717a;">${roadmapPct}% of milestones complete</p>
    </div>` : "";

  const interviewBlock = nextInterview ? `
    <div style="background:linear-gradient(135deg,#0d3d2a,#0f172a);border:1px solid #1a6b4a;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#39f2a0;text-transform:uppercase;letter-spacing:1px;">📅 Upcoming Interview</p>
      <p style="margin:0;font-size:16px;font-weight:800;color:#fff;">${nextInterview.company} — ${nextInterview.role}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#8de9c0;">
        ${nextInterview.days === 0 ? "Today!" : nextInterview.days === 1 ? "Tomorrow!" : `${nextInterview.days} days away`}
      </p>
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your PrepTalk Weekly Digest</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PrepTalk</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px;">

          <p style="margin:0 0 4px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">WEEKLY DIGEST</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#ffffff;">Hey, ${displayName} 👋</h1>

          ${streakBlock}
          ${interviewBlock}

          ${hasActivity ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td width="33%" style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px;text-align:center;">
                <p style="margin:0;font-size:28px;font-weight:800;color:#39f2a0;">${weekSessions}</p>
                <p style="margin:4px 0 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Sessions</p>
              </td>
              <td width="4%"/>
              <td width="33%" style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px;text-align:center;">
                <p style="margin:0;font-size:28px;font-weight:800;color:${scoreColor(weekAvg)};">${weekAvg}</p>
                <p style="margin:4px 0 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Avg Score</p>
              </td>
              <td width="4%"/>
              <td width="33%" style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px;text-align:center;">
                <p style="margin:0;font-size:28px;font-weight:800;color:${improvement > 0 ? '#10b981' : improvement < 0 ? '#ef4444' : '#71717a'};">${improvement > 0 ? '+' : ''}${improvement}%</p>
                <p style="margin:4px 0 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">vs Last Week</p>
              </td>
            </tr>
          </table>

          ${recentRows ? `
          <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:1px;">This Week's Sessions</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${recentRows}</table>` : ""}
          ` : `
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="margin:0;font-size:36px;">😴</p>
            <p style="margin:8px 0 4px;font-size:16px;font-weight:600;color:#ffffff;">No sessions this week</p>
            <p style="margin:0;font-size:13px;color:#71717a;">All-time average: ${allTimeAvg}/10</p>
          </div>`}

          ${roadmapBlock}

          <div style="background:linear-gradient(135deg,#0d4a2f,#0f172a);border-radius:12px;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0;font-size:14px;color:#c8f5e0;line-height:1.6;">${motivationalLine(weekSessions, weekAvg, streak)}</p>
          </div>

          <div style="text-align:center;">
            <a href="${appUrl}/dashboard" style="display:inline-block;background:#39f2a0;color:#0a0d0c;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">
              ${hasActivity ? "View Analytics →" : "Start Practicing →"}
            </a>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#3f3f46;">
            You're receiving this because you have a PrepTalk account.<br/>
            <a href="${unsubUrl}" style="color:#52525b;text-decoration:underline;">Unsubscribe</a>
            &nbsp;·&nbsp;
            <a href="${appUrl}/dashboard/settings" style="color:#52525b;text-decoration:underline;">Email settings</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Route handler ─────────────────────────────────────────────────

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://prep-talk-cyan.vercel.app";
  const sevenDaysAgo    = daysAgo(7);
  const fourteenDaysAgo = daysAgo(14);

  // Fetch all users + profiles (includes email_digest preference)
  const [{ data: mockUsers }, { data: liveUsers }, { data: profiles }] = await Promise.all([
    getSupabaseAdmin().from("preptalk").select("createdBy").not("createdBy", "is", null),
    getSupabaseAdmin().from("liveInterview").select("createdBy").not("createdBy", "is", null),
    getSupabaseAdmin().from("profiles").select("email, username, email_digest"),
  ]);

  const allEmails = new Set([
    ...(mockUsers  || []).map((r) => r.createdBy),
    ...(liveUsers  || []).map((r) => r.createdBy),
  ]);

  // Build profile map — include opt-out status
  const profileMap = {};
  for (const p of (profiles || [])) {
    profileMap[p.email] = { username: p.username, email_digest: p.email_digest };
  }

  const results = { sent: 0, skipped: 0, errors: [] };

  for (const email of allEmails) {
    // Skip opted-out users (null = never set = default opted in)
    if (profileMap[email]?.email_digest === false) {
      results.skipped++;
      continue;
    }

    try {
      const [
        { data: answers },
        { data: liveSessions },
        { data: interviews },
        { data: streakData },
        { data: roadmapData },
        { data: upcomingInterviews },
      ] = await Promise.all([
        getSupabaseAdmin().from("userAnswer").select("mockId, rating, createdAt").eq("userEmail", email),
        getSupabaseAdmin().from("liveInterview").select("score, role, createdAt").eq("createdBy", email).gt("score", 0),
        getSupabaseAdmin().from("preptalk").select("mockId, jobPosition, createdAt").eq("createdBy", email),
        getSupabaseAdmin().from("streak").select("current_streak").eq("email", email).single().catch(() => ({ data: null })),
        getSupabaseAdmin().from("roadmap").select("phases, completed_ids").eq("email", email).single().catch(() => ({ data: null })),
        getSupabaseAdmin().from("upcoming_interviews").select("company, role, interview_date")
          .eq("email", email).eq("status", "upcoming").gte("interview_date", new Date().toISOString().split("T")[0])
          .order("interview_date", { ascending: true }).limit(1),
      ]);

      // Mock session scoring
      const mockRoleMap = {};
      for (const iv of (interviews || [])) mockRoleMap[iv.mockId] = iv.jobPosition;

      const mockSessionMap = {};
      for (const ans of (answers || [])) {
        const r = parseFloat(ans.rating);
        if (isNaN(r)) continue;
        if (!mockSessionMap[ans.mockId]) mockSessionMap[ans.mockId] = { ratings: [], date: ans.createdAt, role: mockRoleMap[ans.mockId] || "Interview" };
        mockSessionMap[ans.mockId].ratings.push(r);
      }
      const mockSessionList = Object.values(mockSessionMap)
        .filter((s) => s.ratings.length > 0)
        .map((s) => ({
          avg: parseFloat((s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length).toFixed(1)),
          date: parseDate(s.date),
          role: s.role,
        }));

      const liveSessionList = (liveSessions || []).map((s) => ({
        avg: parseFloat(s.score),
        date: new Date(s.createdAt),
        role: s.role,
      }));

      const allSessions = [...mockSessionList, ...liveSessionList];
      const thisWeek  = allSessions.filter((s) => s.date >= sevenDaysAgo);
      const lastWeek  = allSessions.filter((s) => s.date >= fourteenDaysAgo && s.date < sevenDaysAgo);

      const weekAvg    = thisWeek.length  ? parseFloat((thisWeek.reduce((s,r)=>s+r.avg,0)/thisWeek.length).toFixed(1))   : 0;
      const lastWeekAvg= lastWeek.length  ? parseFloat((lastWeek.reduce((s,r)=>s+r.avg,0)/lastWeek.length).toFixed(1))   : 0;
      const improvement= lastWeekAvg > 0  ? parseFloat((((weekAvg-lastWeekAvg)/lastWeekAvg)*100).toFixed(1))             : 0;
      const allTimeAvg = allSessions.length ? parseFloat((allSessions.reduce((s,r)=>s+r.avg,0)/allSessions.length).toFixed(1)) : 0;

      // Streak
      const streak = streakData?.current_streak ?? 0;

      // Roadmap %
      let roadmapPct = null;
      if (roadmapData?.phases) {
        const allMilestones = (roadmapData.phases || []).flatMap((p) => p.milestones ?? []);
        const completed = (roadmapData.completed_ids || []).length;
        roadmapPct = allMilestones.length > 0 ? Math.round((completed / allMilestones.length) * 100) : null;
      }

      // Next upcoming interview
      const nextInterviewRaw = upcomingInterviews?.[0] ?? null;
      const nextInterview = nextInterviewRaw ? {
        company: nextInterviewRaw.company,
        role: nextInterviewRaw.role,
        days: daysUntil(nextInterviewRaw.interview_date),
      } : null;

      // Unsubscribe URL with HMAC token
      const unsubToken = await sha256(email + (process.env.CRON_SECRET || "preptalk"));
      const unsubUrl = `${appUrl}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`;

      const html = buildEmail({
        username: profileMap[email]?.username || null,
        email,
        weekSessions: thisWeek.length,
        weekAvg,
        allTimeAvg,
        improvement,
        recentSessions: thisWeek.sort((a, b) => b.date - a.date),
        streak,
        roadmapPct,
        nextInterview,
        appUrl,
        unsubUrl,
      });

      await getResend().emails.send({
        from: "PrepTalk <digest@preptalk.app>",
        to: email,
        subject: thisWeek.length > 0
          ? `Your PrepTalk Week: ${thisWeek.length} session${thisWeek.length > 1 ? "s" : ""}, ${weekAvg}/10 avg`
          : streak > 0
          ? `🔥 ${streak}-day streak — keep it going!`
          : "It's been a quiet week — come back to PrepTalk 💪",
        html,
      });

      results.sent++;
    } catch (err) {
      results.errors.push({ email, error: err.message });
      results.skipped++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}

// POST: send a test digest to a single email (dev use)
export async function POST(req) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Use cron in production" }, { status: 403 });
  }
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const appUrl = "http://localhost:3000";
  const unsubToken = await sha256(email + (process.env.CRON_SECRET || "preptalk"));
  const unsubUrl = `${appUrl}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`;

  const html = buildEmail({
    username: "testuser", email,
    weekSessions: 3, weekAvg: 7.2, allTimeAvg: 6.8, improvement: 12.5,
    recentSessions: [
      { role: "Frontend Developer", avg: 7.5 },
      { role: "React Developer",    avg: 6.8 },
      { role: "Full Stack",         avg: 7.3 },
    ],
    streak: 5,
    roadmapPct: 60,
    nextInterview: { company: "Stripe", role: "SDE-2", days: 3 },
    appUrl, unsubUrl,
  });

  const { data, error } = await getResend().emails.send({
    from: "PrepTalk <digest@preptalk.app>",
    to: email,
    subject: "PrepTalk — Test Digest Email",
    html,
  });

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
