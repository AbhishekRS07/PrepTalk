import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Postgres-backed rate limiting — no app route had any throttling beyond whatever the
// AI providers themselves enforce, so an authenticated (or scripted) session could fire
// AI-generation / PDF-parsing requests as fast as the client allowed. Backed by the
// `rl_hit` DB function (atomic UPSERT, so concurrent requests can't race past the
// limit) rather than in-memory counters, which wouldn't be reliable across Vercel's
// separate serverless instances.
let _admin;
const getAdmin = () => {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _admin;
};

/**
 * Checks and increments a rate-limit counter for `${routeKey}:${identity}`.
 * Returns { allowed, retryAfterSeconds }.
 */
export async function checkRateLimit(identity, routeKey, limit, windowSeconds) {
  const admin = getAdmin();
  const { data, error } = await admin.rpc("rl_hit", {
    p_key: `${routeKey}:${identity}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    // Fail open — a rate-limit outage shouldn't take the whole feature down with it.
    console.error("Rate limit check failed:", error.message);
    return { allowed: true };
  }
  const row = data?.[0];
  return { allowed: row?.allowed ?? true, retryAfterSeconds: row?.retry_after ?? 0 };
}

/**
 * Convenience wrapper for API routes: returns a ready-to-return 429 NextResponse if the
 * caller is over the limit, or null if they're clear to proceed.
 */
export async function rateLimitOrResponse(email, routeKey, limit, windowSeconds) {
  const { allowed, retryAfterSeconds } = await checkRateLimit(email, routeKey, limit, windowSeconds);
  if (allowed) return null;
  return NextResponse.json(
    { error: `Too many requests — please wait about ${retryAfterSeconds}s and try again.` },
    { status: 429 }
  );
}
