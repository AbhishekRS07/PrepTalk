import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { mockId } = await params;

  const { data, error } = await supabase
    .from("userAnswer")
    .select("*")
    .eq("mockId", mockId)
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
