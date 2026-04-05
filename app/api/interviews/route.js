import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("preptalk")
    .select("*")
    .eq("createdBy", email)
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Only return interviews where the user answered at least one question
  const { data: answers } = await supabase
    .from("userAnswer")
    .select("mockId")
    .eq("userEmail", email);

  const answeredMockIds = new Set((answers || []).map((a) => a.mockId));
  const completed = (data || []).filter((iv) => answeredMockIds.has(iv.mockId));

  return NextResponse.json(completed);
}
