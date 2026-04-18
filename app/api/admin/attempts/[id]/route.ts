import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateOverallScore } from "@/lib/scoring";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: attemptId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: { id: true, userId: true },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  await prisma.attempt.update({
    where: { id: attemptId },
    data: { archivedAt: new Date() },
  });

  await updateOverallScore(attempt.userId);

  return NextResponse.json({ archived: true });
}
