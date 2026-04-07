import { requireUser } from "@/lib/auth";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/email/unsubscribe?email=x&token=y  — one-click unsubscribe from email links
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email || !token) {
    return new Response("<p>Invalid unsubscribe link.</p>", { status: 400, headers: { "Content-Type": "text/html" } });
  }

  // Verify token = sha256(email + CRON_SECRET)
  const expected = await sha256(email + (process.env.CRON_SECRET || "preptalk"));
  if (token !== expected) {
    return new Response("<p>Invalid or expired unsubscribe link.</p>", { status: 403, headers: { "Content-Type": "text/html" } });
  }

  await supabaseAdmin
    .from("profiles")
    .upsert({ email, email_digest: false }, { onConflict: "email" });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://prep-talk-cyan.vercel.app";

  return new Response(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Unsubscribed</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#09090b;color:#fff;">
  <div style="text-align:center;max-width:400px;padding:40px;">
    <p style="font-size:40px;margin:0 0 16px">✅</p>
    <h1 style="font-size:22px;font-weight:800;margin:0 0 8px">Unsubscribed</h1>
    <p style="color:#71717a;margin:0 0 24px;font-size:14px">You won't receive weekly digest emails anymore. You can re-enable them anytime from your dashboard settings.</p>
    <a href="${appUrl}/dashboard/settings" style="background:#8b5cf6;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Go to Settings</a>
  </div>
</body></html>`, { headers: { "Content-Type": "text/html" } });
}

// POST /api/email/unsubscribe — toggle from dashboard
export async function POST(req) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { enabled } = await req.json();

  const { error } = await supabase
    .from("profiles")
    .upsert({ email: user.email, email_digest: enabled }, { onConflict: "email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, email_digest: enabled });
}

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
