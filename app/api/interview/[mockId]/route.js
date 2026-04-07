import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { mockId } = await params;

  const { data, error } = await supabase
    .from("preptalk")
    .select("*")
    .eq("mockId", mockId)
    .single();

  if (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const { supabase, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { mockId } = await params;

  const { error } = await supabase
    .from("preptalk")
    .delete()
    .eq("mockId", mockId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
