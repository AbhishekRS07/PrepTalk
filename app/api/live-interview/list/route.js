import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const { data, error } = await supabase
    .from("liveInterview")
    .select("mockId, role, experience, techStack, score, debrief, createdAt, messages")
    .eq("createdBy", email)
    .order("id", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
