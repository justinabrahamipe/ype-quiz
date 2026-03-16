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
  const body = await req.json();
  const { question_id, submitted_text, question_started_at } = body;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const now = new Date();
  if (now < quiz.startTime || now > quiz.endTime) {
    return NextResponse.json({ error: "Quiz is not active" }, { status: 403 });
  }

  const attempt = await prisma.attempt.findUnique({
    where: { quizId_userId: { quizId, userId: session.user.id } },
  });

  if (!attempt || attempt.isComplete) {
    return NextResponse.json({ error: "No active attempt" }, { status: 403 });
  }

  // Calculate time taken
  const startedAt = new Date(question_started_at);
  const timeTaken = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

  // Upsert answer
  const existingAnswer = await prisma.answer.findFirst({
    where: { attemptId: attempt.id, questionId: question_id },
  });

  if (existingAnswer) {
    await prisma.answer.update({
      where: { id: existingAnswer.id },
      data: {
        submittedText: submitted_text || null,
        answeredAt: now,
        timeTakenSeconds: Math.min(timeTaken, 120),
      },
    });
  } else {
    await prisma.answer.create({
      data: {
        attemptId: attempt.id,
        questionId: question_id,
        submittedText: submitted_text || null,
        answeredAt: now,
        timeTakenSeconds: Math.min(timeTaken, 120),
      },
    });
  }

  // Check if all questions answered
  const answerCount = await prisma.answer.count({
    where: { attemptId: attempt.id },
  });

  return NextResponse.json({
    saved: true,
    quiz_complete: answerCount >= quiz.questionCount,
  });
}
