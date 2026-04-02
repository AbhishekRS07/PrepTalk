import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { eq } from "drizzle-orm";

export async function GET(request, { params }) {
  const { userId } = await auth();
  if (!userId) {
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
