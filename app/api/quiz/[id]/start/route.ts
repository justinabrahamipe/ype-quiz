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

  // Non-prerequisite quizzes require the user to be both approved and qualified
  if (!quiz.isPrerequisite) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isQualified: true, isApproved: true },
    });
    if (!user?.isApproved) {
      return NextResponse.json(
        { error: "Your account is pending approval" },
        { status: 403 }
      );
    }
    if (!user?.isQualified) {
      return NextResponse.json(
        { error: "You must pass the prerequisite quiz first" },
        { status: 403 }
      );
    }
  }

  let existingAttempt = await prisma.attempt.findUnique({
    where: { quizId_userId: { quizId, userId: session.user.id } },
    include: { answers: true },
  });

  // If the previous attempt was archived by an admin, clear it so the user can retry.
  if (existingAttempt?.archivedAt) {
    await prisma.answer.deleteMany({ where: { attemptId: existingAttempt.id } });
    await prisma.attempt.delete({ where: { id: existingAttempt.id } });
    existingAttempt = null;
  }

  if (existingAttempt?.isComplete) {
    // Allow retry for prerequisite quizzes if user hasn't qualified yet
    if (quiz.isPrerequisite) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isQualified: true },
      });
      if (!user?.isQualified) {
        // Delete old attempt and answers to allow retry
        await prisma.answer.deleteMany({ where: { attemptId: existingAttempt.id } });
        await prisma.attempt.delete({ where: { id: existingAttempt.id } });
        const newAttempt = await prisma.attempt.create({
          data: { quizId, userId: session.user.id },
          include: { answers: true },
        });
        return NextResponse.json({
          attemptId: newAttempt.id,
          nextQuestionIndex: 0,
          questions: quiz.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            answerType: q.answerType,
            orderIndex: q.orderIndex,
          })),
          serverTimestamp: new Date().toISOString(),
          existingAnswers: [],
        });
      }
    }
    return NextResponse.json({ error: "Already completed" }, { status: 403 });
  }

  let attempt = existingAttempt;
  if (!attempt) {
    attempt = await prisma.attempt.create({
      data: { quizId, userId: session.user.id },
      include: { answers: true },
    });
  }

  // Shuffle questions deterministically per user (seed = visitorId + quizId)
  const seed = (session.user.id + quizId).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...quiz.questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed * (i + 1) * 2654435761) % (i + 1);
    [shuffled[i], shuffled[Math.abs(j)]] = [shuffled[Math.abs(j)], shuffled[i]];
  }

  // Find first unanswered question index
  const answeredQuestionIds = new Set(attempt.answers.map((a) => a.questionId));
  let nextIndex = 0;
  for (let i = 0; i < shuffled.length; i++) {
    if (!answeredQuestionIds.has(shuffled[i].id)) {
      nextIndex = i;
      break;
    }
  }

  return NextResponse.json({
    attemptId: attempt.id,
    nextQuestionIndex: nextIndex,
    questions: shuffled.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      answerType: q.answerType,
      orderIndex: q.orderIndex,
    })),
    serverTimestamp: new Date().toISOString(),
    existingAnswers: attempt.answers.map((a) => ({
      questionId: a.questionId,
      submittedText: a.submittedText,
      answeredAt: a.answeredAt?.toISOString() || null,
      timeTakenSeconds: a.timeTakenSeconds,
    })),
  });
}
