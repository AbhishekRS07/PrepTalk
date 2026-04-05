import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const { data, error } = await supabase
    .from("profiles")
    .select("username, email, resume_name")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? { username: null });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, username } = await request.json();
  if (!email || !username) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (clean.length < 3) return NextResponse.json({ error: "Username must be at least 3 characters (letters, numbers, underscores only)" }, { status: 400 });
  if (clean.length > 20) return NextResponse.json({ error: "Username must be 20 characters or less" }, { status: 400 });

  // Check uniqueness
  const { data: existing } = await supabase
    .from("profiles")
    .select("email")
    .eq("username", clean)
    .single();

  if (existing && existing.email !== email) {
    return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ email, username: clean }, { onConflict: "email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ username: clean });
}
