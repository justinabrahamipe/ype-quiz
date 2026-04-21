import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    select: {
      id: true,
      userId: true,
      quiz: { select: { isPrerequisite: true } },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  await prisma.attempt.update({
    where: { id: attemptId },
    data: { archivedAt: new Date() },
  });

  // Removing a qualifying-quiz attempt revokes the qualification it granted,
  // so the user can re-take the quiz and re-qualify.
  if (attempt.quiz.isPrerequisite) {
    await prisma.user.update({
      where: { id: attempt.userId },
      data: { isQualified: false },
    });
  }

  return NextResponse.json({ archived: true });
}
