import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { runPrompt } from "@/lib/langchain";

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const text = await runPrompt(prompt);
  return NextResponse.json({ text });
}
