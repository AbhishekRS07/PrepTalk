import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { runPrompt } from "@/lib/langchain";

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const text = await runPrompt(prompt);
  return NextResponse.json({ text });
}
