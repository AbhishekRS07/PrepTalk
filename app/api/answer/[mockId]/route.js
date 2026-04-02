import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { eq } from "drizzle-orm";

export async function GET(request, { params }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mockId } = params;
  const result = await db
    .select()
    .from(UserAnswer)
    .where(eq(UserAnswer.mockIdRef, mockId))
    .orderBy(UserAnswer.id);

  return NextResponse.json(result);
}
