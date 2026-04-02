import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { PrepTalk } from "@/utils/schema";
import { eq } from "drizzle-orm";

export async function GET(request, { params }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mockId } = params;
  const result = await db
    .select()
    .from(PrepTalk)
    .where(eq(PrepTalk.mockId, mockId));

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(request, { params }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mockId } = params;
  await db.delete(PrepTalk).where(eq(PrepTalk.mockId, mockId));

  return NextResponse.json({ success: true });
}
