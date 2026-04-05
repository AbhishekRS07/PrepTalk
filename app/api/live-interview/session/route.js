import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mockId = searchParams.get("mockId");
  if (!mockId) return NextResponse.json({ error: "Missing mockId" }, { status: 400 });

  const { data, error } = await supabase
    .from("liveInterview")
    .select("*")
    .eq("mockId", mockId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
