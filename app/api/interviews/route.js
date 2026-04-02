import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { PrepTalk } from "@/utils/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const result = await db
    .select()
    .from(PrepTalk)
    .where(eq(PrepTalk.createdBy, email))
    .orderBy(desc(PrepTalk.id));

  return NextResponse.json(result);
}
