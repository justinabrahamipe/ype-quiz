import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserAggregate } from "@/lib/aggregate-score";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "quizmaster")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      attempts: {
        where: { isComplete: true },
        include: {
          quiz: { select: { title: true, questionCount: true, isPrerequisite: true } },
          answers: {
            include: { question: { select: { questionText: true, acceptedAnswers: true, answerType: true, orderIndex: true } } },
            orderBy: { question: { orderIndex: "asc" } },
          },
        },
        orderBy: { completedAt: "desc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const aggregate = await getUserAggregate(userId);
  return NextResponse.json({ ...user, score: aggregate.totalScore });
}

// Update individual answer marks
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "quizmaster")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  // Toggle a single answer's correctness
  if (action === "toggle_answer") {
    const { answerId } = body;
    const answer = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    const newValue = !answer.isCorrect;
    await prisma.answer.update({
      where: { id: answerId },
      data: { isCorrect: newValue, manuallyOverridden: true },
    });

    // Recalculate attempt raw score
    const attempt = await prisma.attempt.findUnique({
      where: { id: answer.attemptId },
      include: { answers: true },
    });

    if (attempt) {
      const correctCount = attempt.answers.filter((a) =>
        a.id === answerId ? newValue : a.isCorrect
      ).length;

      await prisma.attempt.update({
        where: { id: attempt.id },
        data: { rawScore: correctCount },
      });
    }

    return NextResponse.json({ updated: true, isCorrect: newValue });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
