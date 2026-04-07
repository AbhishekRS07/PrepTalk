import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { data, error } = await supabase
    .from("interview_journal")
    .select("*")
    .eq("email", user.email)
    .order("interview_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const { company, role, interview_date, round_type, feeling, questions_asked, how_it_went, what_to_improve, outcome } = body;

  if (!company || !role || !interview_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("interview_journal")
    .insert({
      email: user.email,
      company,
      role,
      interview_date,
      round_type: round_type || "technical",
      feeling: feeling || "okay",
      questions_asked: questions_asked || "",
      how_it_went: how_it_went || "",
      what_to_improve: what_to_improve || "",
      outcome: outcome || "waiting",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  delete updates.email; // never allow overwriting email
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("interview_journal")
    .update(updates)
    .eq("id", id)
    .eq("email", user.email)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase
    .from("interview_journal")
    .delete()
    .eq("id", id)
    .eq("email", user.email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
