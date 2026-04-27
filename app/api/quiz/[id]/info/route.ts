import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      title: true,
      biblePortion: true,
      questionCount: true,
      isPrerequisite: true,
      startTime: true,
      endTime: true,
      secondsPerQuestion: true,
    },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const now = new Date();
  let status: "upcoming" | "active" | "ended" = "active";
  if (now < quiz.startTime) status = "upcoming";
  else if (now > quiz.endTime) status = "ended";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isQualified: true, isApproved: true },
  });

  const attempt = await prisma.attempt.findUnique({
    where: { quizId_userId: { quizId, userId: session.user.id } },
    select: { isComplete: true, archivedAt: true },
  });

  return NextResponse.json({
    quiz: {
      title: quiz.title,
      biblePortion: quiz.biblePortion,
      questionCount: quiz.questionCount,
      isPrerequisite: quiz.isPrerequisite,
      startTime: quiz.startTime.toISOString(),
      endTime: quiz.endTime.toISOString(),
      secondsPerQuestion: quiz.secondsPerQuestion,
    },
    status,
    userApproved: !!user?.isApproved,
    userQualified: !!user?.isQualified,
    hasInProgress: !!attempt && !attempt.isComplete && !attempt.archivedAt,
    hasCompleted: !!attempt && attempt.isComplete && !attempt.archivedAt,
  });
}
