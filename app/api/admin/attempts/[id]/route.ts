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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: attemptId } = await params;
  const body = await req.json().catch(() => ({}));

  if (body.action !== "unarchive") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      quizId: true,
      userId: true,
      isComplete: true,
      rawScore: true,
      archivedAt: true,
      quiz: {
        select: {
          isPrerequisite: true,
          _count: { select: { questions: true } },
        },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  if (!attempt.archivedAt) {
    return NextResponse.json({ error: "Attempt is not archived" }, { status: 400 });
  }

  // The user can only have one non-archived attempt per quiz; if a newer one
  // exists, refuse rather than violating the unique [quizId, userId] index.
  const existingActive = await prisma.attempt.findFirst({
    where: {
      quizId: attempt.quizId,
      userId: attempt.userId,
      id: { not: attempt.id },
      archivedAt: null,
    },
    select: { id: true },
  });

  if (existingActive) {
    return NextResponse.json(
      { error: "User already has an active attempt for this quiz" },
      { status: 409 }
    );
  }

  await prisma.attempt.update({
    where: { id: attemptId },
    data: { archivedAt: null },
  });

  // Restore qualification if this was a passing prerequisite attempt.
  if (attempt.quiz.isPrerequisite && attempt.isComplete) {
    const total = attempt.quiz._count.questions;
    const correct = Number(attempt.rawScore ?? 0);
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    if (percentage >= 70) {
      await prisma.user.update({
        where: { id: attempt.userId },
        data: { isQualified: true },
      });
    }
  }

  return NextResponse.json({ unarchived: true });
}
