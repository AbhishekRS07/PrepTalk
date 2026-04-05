import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { extractText } from "unpdf";

// POST: parse PDF and save resume text + name to user's profile
export async function POST(req) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  let resumeText = "";
  try {
    const arrayBuffer = await file.arrayBuffer();
    const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });
    resumeText = text?.trim() || "";
  } catch (err) {
    return NextResponse.json({ error: `PDF parse error: ${err.message}` }, { status: 400 });
  }

  if (resumeText.length < 50) {
    return NextResponse.json({ error: "Could not extract text from this PDF." }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(
      { email: user.email, resume_name: file.name, resume_text: resumeText.slice(0, 8000) },
      { onConflict: "email" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, resumeName: file.name });
}

// DELETE: remove saved resume from profile
export async function DELETE(req) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("profiles")
    .update({ resume_name: null, resume_text: null })
    .eq("email", user.email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
