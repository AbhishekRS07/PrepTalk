import { requireUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  const { data } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("email", user.email)
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(req) {
  const { user, supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { question, answer, profile } = await req.json();
  if (!question) return NextResponse.json({ error: "Missing question" }, { status: 400 });

  // Toggle: delete if exists, insert if not
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("email", user.email)
    .eq("question", question)
    .maybeSingle();

  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id);
    return NextResponse.json({ bookmarked: false });
  }

  await supabase.from("bookmarks").insert({
    email: user.email,
    question,
    answer: answer || "",
    profile: profile || "",
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ bookmarked: true });
}
