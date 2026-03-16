import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: quizId } = await params;
  const now = new Date();

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  if (now < quiz.startTime || now > quiz.endTime) {
    return NextResponse.json({ error: "Quiz is not active" }, { status: 403 });
  }

  const existingAttempt = await prisma.attempt.findUnique({
    where: { quizId_userId: { quizId, userId: session.user.id } },
    include: { answers: true },
  });

  if (existingAttempt?.isComplete) {
    return NextResponse.json({ error: "Already completed" }, { status: 403 });
  }

  let attempt = existingAttempt;
  if (!attempt) {
    attempt = await prisma.attempt.create({
      data: { quizId, userId: session.user.id },
      include: { answers: true },
    });
  }

  // Find first unanswered question index
  const answeredQuestionIds = new Set(attempt.answers.map((a) => a.questionId));
  let nextIndex = 0;
  for (let i = 0; i < quiz.questions.length; i++) {
    if (!answeredQuestionIds.has(quiz.questions[i].id)) {
      nextIndex = i;
      break;
    }
  }

  return NextResponse.json({
    attemptId: attempt.id,
    nextQuestionIndex: nextIndex,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      answerType: q.answerType,
      orderIndex: q.orderIndex,
    })),
    serverTimestamp: new Date().toISOString(),
    existingAnswers: attempt.answers.map((a) => ({
      questionId: a.questionId,
      submittedText: a.submittedText,
    })),
  });
}
