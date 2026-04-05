import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// POST /api/share — generate or return existing share token for a mockId
export async function POST(req) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mockId } = await req.json();
  if (!mockId) return NextResponse.json({ error: "Missing mockId" }, { status: 400 });

  // Verify ownership
  const { data: interview } = await supabase
    .from("preptalk")
    .select("mockId, shareToken")
    .eq("mockId", mockId)
    .eq("createdBy", user.email)
    .single();

  if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Return existing token if already shared
  if (interview.shareToken) {
    return NextResponse.json({ token: interview.shareToken });
  }

  // Generate a new token
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 20);

  const { error } = await supabase
    .from("preptalk")
    .update({ shareToken: token })
    .eq("mockId", mockId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ token });
}
