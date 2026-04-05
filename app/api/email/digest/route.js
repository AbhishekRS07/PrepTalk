import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

// Lazy — instantiated inside handlers so build doesn't fail without env vars
const getResend = () => new Resend(process.env.RESEND_API_KEY);

// Admin client — bypasses RLS to read all users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Helpers ───────────────────────────────────────────────────────

function parseDate(str) {
  if (!str) return null;
  // "DD-MM-YYYY" format used in the app
  const [dd, mm, yyyy] = str.split("-");
  return new Date(`${yyyy}-${mm}-${dd}`);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function scoreColor(avg) {
  if (avg >= 7.5) return "#10b981";
  if (avg >= 5)   return "#f59e0b";
  return "#ef4444";
}

function improvementText(pct) {
  if (pct > 0)  return `↑ ${pct}% improvement`;
  if (pct < 0)  return `↓ ${Math.abs(pct)}% from last week`;
  return "Steady performance";
}

function motivationalLine(sessions, avg) {
  if (sessions === 0) return "You haven't practiced this week — even one session makes a difference!";
  if (avg >= 8)       return "Outstanding work this week. You're in top form! 🔥";
  if (avg >= 6.5)     return "Solid week! Keep the momentum going and you'll ace your next interview.";
  if (sessions >= 3)  return "Great consistency! More reps = more confidence. You're building something real.";
  return "Every practice session compounds. Keep showing up — you're getting better.";
}

// ── Email HTML ────────────────────────────────────────────────────

function buildEmail({ username, email, weekSessions, weekAvg, allTimeAvg, improvement, recentSessions, appUrl }) {
  const displayName = username || email.split("@")[0];
  const hasActivity = weekSessions > 0;

  const recentRows = recentSessions.slice(0, 3).map((s) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1f2937;font-size:14px;color:#d1d5db;">${s.role}</td>
      <td style="padding:10px 0;border-bottom:1px solid #1f2937;font-size:14px;color:${scoreColor(s.avg)};font-weight:700;text-align:right;">${s.avg}/10</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your PrepTalk Weekly Digest</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PrepTalk</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px;">

              <!-- Greeting -->
              <p style="margin:0 0 4px 0;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">WEEKLY DIGEST</p>
              <h1 style="margin:0 0 24px 0;font-size:24px;font-weight:800;color:#ffffff;">Hey, ${displayName} 👋</h1>

              ${hasActivity ? `
              <!-- Stats row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="33%" style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:800;color:#8b5cf6;">${weekSessions}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Sessions</p>
                  </td>
                  <td width="4%" />
                  <td width="33%" style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:800;color:${scoreColor(weekAvg)};">${weekAvg}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Avg Score</p>
                  </td>
                  <td width="4%" />
                  <td width="33%" style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:800;color:${improvement > 0 ? '#10b981' : improvement < 0 ? '#ef4444' : '#71717a'};">${improvement > 0 ? '+' : ''}${improvement}%</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">vs Last Week</p>
                  </td>
                </tr>
              </table>

              <!-- Recent sessions -->
              ${recentRows ? `
              <p style="margin:0 0 12px 0;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:1px;">This Week's Sessions</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                ${recentRows}
              </table>` : ""}
              ` : `
              <!-- No activity -->
              <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0;font-size:36px;">😴</p>
                <p style="margin:8px 0 4px;font-size:16px;font-weight:600;color:#ffffff;">No sessions this week</p>
                <p style="margin:0;font-size:13px;color:#71717a;">All-time average: ${allTimeAvg}/10</p>
              </div>
              `}

              <!-- Motivational line -->
              <div style="background:linear-gradient(135deg,#4c1d95,#1e1b4b);border-radius:12px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0;font-size:14px;color:#e0d9ff;line-height:1.6;">${motivationalLine(weekSessions, weekAvg)}</p>
              </div>

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="${appUrl}/dashboard" style="display:inline-block;background:#8b5cf6;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">
                  ${hasActivity ? "View Analytics →" : "Start Practicing →"}
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#3f3f46;">
                You're receiving this because you have a PrepTalk account.<br/>
                <a href="${appUrl}/dashboard" style="color:#52525b;text-decoration:underline;">Manage preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Route handler ─────────────────────────────────────────────────

export async function GET(req) {
  // Verify Vercel cron secret (Vercel sets Authorization: Bearer <CRON_SECRET>)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://preptalk.app";
  const sevenDaysAgo = daysAgo(7);
  const fourteenDaysAgo = daysAgo(14);

  // Get all unique user emails from preptalk + userAnswer + liveInterview
  const [{ data: mockUsers }, { data: liveUsers }, { data: profiles }] = await Promise.all([
    supabaseAdmin.from("preptalk").select("createdBy").not("createdBy", "is", null),
    supabaseAdmin.from("liveInterview").select("createdBy").not("createdBy", "is", null),
    supabaseAdmin.from("profiles").select("email, username"),
  ]);

  const allEmails = new Set([
    ...(mockUsers || []).map((r) => r.createdBy),
    ...(liveUsers || []).map((r) => r.createdBy),
  ]);

  const profileMap = {};
  for (const p of (profiles || [])) profileMap[p.email] = p.username;

  const results = { sent: 0, skipped: 0, errors: [] };

  for (const email of allEmails) {
    try {
      // Fetch this user's full history
      const [{ data: answers }, { data: liveSessions }, { data: interviews }] = await Promise.all([
        supabaseAdmin.from("userAnswer").select("mockId, rating, createdAt").eq("userEmail", email),
        supabaseAdmin.from("liveInterview").select("score, role, createdAt").eq("createdBy", email).gt("score", 0),
        supabaseAdmin.from("preptalk").select("mockId, jobPosition, createdAt").eq("createdBy", email),
      ]);

      // Map mockId → role for mock answers
      const mockRoleMap = {};
      for (const iv of (interviews || [])) mockRoleMap[iv.mockId] = iv.jobPosition;

      // Build all scored sessions
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

      // Filter to this week and last week
      const thisWeek = allSessions.filter((s) => s.date >= sevenDaysAgo);
      const lastWeek = allSessions.filter((s) => s.date >= fourteenDaysAgo && s.date < sevenDaysAgo);

      const weekAvg = thisWeek.length
        ? parseFloat((thisWeek.reduce((s, r) => s + r.avg, 0) / thisWeek.length).toFixed(1))
        : 0;
      const lastWeekAvg = lastWeek.length
        ? parseFloat((lastWeek.reduce((s, r) => s + r.avg, 0) / lastWeek.length).toFixed(1))
        : 0;
      const improvement = lastWeekAvg > 0
        ? parseFloat((((weekAvg - lastWeekAvg) / lastWeekAvg) * 100).toFixed(1))
        : 0;
      const allTimeAvg = allSessions.length
        ? parseFloat((allSessions.reduce((s, r) => s + r.avg, 0) / allSessions.length).toFixed(1))
        : 0;

      // Sort this week's sessions newest first for the email
      const recentSessions = thisWeek.sort((a, b) => b.date - a.date);

      const html = buildEmail({
        username: profileMap[email] || null,
        email,
        weekSessions: thisWeek.length,
        weekAvg,
        allTimeAvg,
        improvement,
        recentSessions,
        appUrl,
      });

      await getResend().emails.send({
        from: "PrepTalk <onboarding@resend.dev>",
        to: email,
        subject: thisWeek.length > 0
          ? `Your PrepTalk Week: ${thisWeek.length} session${thisWeek.length > 1 ? "s" : ""}, ${weekAvg}/10 avg`
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

  const fakeHtml = buildEmail({
    username: "testuser",
    email,
    weekSessions: 3,
    weekAvg: 7.2,
    allTimeAvg: 6.8,
    improvement: 12.5,
    recentSessions: [
      { role: "Frontend Developer", avg: 7.5 },
      { role: "React Developer",   avg: 6.8 },
      { role: "Full Stack",        avg: 7.3 },
    ],
    appUrl: "http://localhost:3000",
  });

  const { data, error } = await getResend().emails.send({
    from: "PrepTalk <onboarding@resend.dev>",
    to: email,
    subject: "PrepTalk — Test Digest Email",
    html: fakeHtml,
  });

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
