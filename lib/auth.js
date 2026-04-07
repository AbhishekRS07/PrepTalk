import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Validates the current session and returns the authenticated user + supabase client.
 *
 * Usage:
 *   const { user, supabase, unauthorized } = await requireUser();
 *   if (unauthorized) return unauthorized;
 *
 * @returns {{ user: import('@supabase/supabase-js').User, supabase: any, unauthorized: null }
 *          | { user: null, supabase: any, unauthorized: NextResponse }}
 */
export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, supabase, unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, supabase, unauthorized: null };
}
