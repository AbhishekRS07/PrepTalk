import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET — fetch the user's current roadmap
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("roadmap")
    .select("*")
    .eq("email", user.email)
    .single();

  if (!data) return NextResponse.json(null);
  return NextResponse.json(data);
}

// PATCH — update completed milestone IDs
export async function PATCH(req) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { completedIds } = await req.json();

  const { error } = await supabase
    .from("roadmap")
    .update({ completed_ids: completedIds, updated_at: new Date().toISOString() })
    .eq("email", user.email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — reset roadmap so user can regenerate
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("roadmap").delete().eq("email", user.email);
  return NextResponse.json({ ok: true });
}
