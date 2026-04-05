import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import moment from "moment";

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mockId, role, experience, techStack, messages, debrief, createdBy } = await request.json();

  if (!mockId || !role || !createdBy) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabase.from("liveInterview").insert({
    mockId,
    role,
    experience,
    techStack,
    messages,
    debrief,
    score: debrief?.score ?? 0,
    createdBy,
    createdAt: moment().format("DD-MM-YYYY"),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, mockId });
}
