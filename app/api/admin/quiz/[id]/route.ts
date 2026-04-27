import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "quizmaster")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: quizId } = await params;
  const body = await req.json();
  const { startTime, endTime, title, biblePortion, questions, secondsPerQuestion } = body;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const quizUpdates: Record<string, unknown> = {};

  if (startTime) quizUpdates.startTime = new Date(startTime);
  if (endTime) quizUpdates.endTime = new Date(endTime);
  if (title) quizUpdates.title = title;
  if (biblePortion) quizUpdates.biblePortion = biblePortion;
  if (
    secondsPerQuestion != null &&
    Number.isFinite(secondsPerQuestion) &&
    secondsPerQuestion > 0
  ) {
    quizUpdates.secondsPerQuestion = Math.floor(secondsPerQuestion);
  }

  if (quizUpdates.startTime && quizUpdates.endTime && (quizUpdates.endTime as Date) <= (quizUpdates.startTime as Date)) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  if (Object.keys(quizUpdates).length > 0) {
    await prisma.quiz.update({
      where: { id: quizId },
      data: quizUpdates,
    });
  }

  // Update individual questions
  if (questions && Array.isArray(questions)) {
    for (const q of questions) {
      if (!q.id) continue;
      const questionUpdates: Record<string, unknown> = {};
      if (q.questionText !== undefined) questionUpdates.questionText = q.questionText;
      if (q.acceptedAnswers !== undefined) questionUpdates.acceptedAnswers = q.acceptedAnswers;
      if (q.answerType !== undefined) questionUpdates.answerType = q.answerType;
      if (Array.isArray(q.choices)) {
        questionUpdates.choices = q.choices.filter((c: string) => c && c.trim());
      }
      if (q.maxAnswerLength !== undefined) {
        questionUpdates.maxAnswerLength =
          q.maxAnswerLength != null && Number.isFinite(q.maxAnswerLength) && q.maxAnswerLength > 0
            ? Math.floor(q.maxAnswerLength)
            : null;
      }
      if (Object.keys(questionUpdates).length > 0) {
        await prisma.question.update({
          where: { id: q.id },
          data: questionUpdates,
        });
      }
    }
  }

  // Add a new question
  if (body.addQuestion) {
    const { questionText, answerType, acceptedAnswers, choices, maxAnswerLength } = body.addQuestion;
    const maxOrder = await prisma.question.findFirst({
      where: { quizId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    await prisma.question.create({
      data: {
        quizId,
        questionText,
        answerType: answerType || "mcq",
        acceptedAnswers: acceptedAnswers || [],
        choices: Array.isArray(choices) ? choices.filter((c: string) => c && c.trim()) : [],
        orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
        maxAnswerLength:
          maxAnswerLength != null && Number.isFinite(maxAnswerLength) && maxAnswerLength > 0
            ? Math.floor(maxAnswerLength)
            : null,
      },
    });
    await prisma.quiz.update({
      where: { id: quizId },
      data: { questionCount: { increment: 1 } },
    });
  }

  // Delete a question
  if (body.deleteQuestionId) {
    // Check no answers reference this question
    const answerCount = await prisma.answer.count({ where: { questionId: body.deleteQuestionId } });
    if (answerCount > 0) {
      await prisma.answer.deleteMany({ where: { questionId: body.deleteQuestionId } });
    }
    await prisma.question.delete({ where: { id: body.deleteQuestionId } });
    await prisma.quiz.update({
      where: { id: quizId },
      data: { questionCount: { decrement: 1 } },
    });
  }

  return NextResponse.json({ id: quizId, updated: true });
}

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "mahanaimype@gmail.com";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Only super admin can delete quizzes
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Only super admin can delete quizzes" }, { status: 403 });
  }

  const { id: quizId } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  // Delete in order: answers -> attempts -> questions -> quiz
  const attempts = await prisma.attempt.findMany({ where: { quizId }, select: { id: true } });
  const attemptIds = attempts.map((a) => a.id);

  if (attemptIds.length > 0) {
    await prisma.answer.deleteMany({ where: { attemptId: { in: attemptIds } } });
  }
  await prisma.attempt.deleteMany({ where: { quizId } });
  await prisma.question.deleteMany({ where: { quizId } });
  await prisma.quiz.delete({ where: { id: quizId } });

  return NextResponse.json({ deleted: true });
}
