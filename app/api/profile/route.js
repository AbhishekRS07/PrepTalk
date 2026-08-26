import { requireUser } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Username uniqueness has to be checked across every account, which the caller's own
// RLS-scoped session client can't (and shouldn't) see. Service-role, used only for that
// one cross-user lookup — every write below is still scoped to the caller's own session.
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

export async function GET(request) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const requestedEmail = searchParams.get("email");
  if (!requestedEmail) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  if (requestedEmail !== user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("username, email, resume_name")
    .eq("email", user.email)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? { username: null });
}

export async function POST(request) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { username } = await request.json();
  if (!username) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (clean.length < 3) return NextResponse.json({ error: "Username must be at least 3 characters (letters, numbers, underscores only)" }, { status: 400 });
  if (clean.length > 20) return NextResponse.json({ error: "Username must be 20 characters or less" }, { status: 400 });

  // Check uniqueness across all accounts
  const { data: existing } = await getSupabaseAdmin()
    .from("profiles")
    .select("email")
    .eq("username", clean)
    .single();

  if (existing && existing.email !== user.email) {
    return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ email: user.email, username: clean }, { onConflict: "email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ username: clean });
}
