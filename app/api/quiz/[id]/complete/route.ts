import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isCorrect as checkAnswer } from "@/lib/answer-matcher";
import { updateOverallScore } from "@/lib/scoring";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: quizId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { quizId_userId: { quizId, userId: session.user.id } },
    include: { answers: true },
  });

  if (!attempt || attempt.archivedAt) {
    return NextResponse.json({ error: "No attempt found" }, { status: 404 });
  }

  if (attempt.isComplete) {
    return NextResponse.json({ error: "Already completed" }, { status: 400 });
  }

  await prisma.attempt.update({
    where: { id: attempt.id },
    data: { isComplete: true, completedAt: new Date() },
  });

  // Check if this is a prerequisite quiz — grade immediately and qualify if >= 70%
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) {
    return NextResponse.json({ submitted: true });
  }

  // Grade immediately so the user sees their score right away
  const freshAnswers = await prisma.answer.findMany({
    where: { attemptId: attempt.id },
  });

  let correct = 0;
  for (const question of quiz.questions) {
    const userAnswers = freshAnswers.filter((a) => a.questionId === question.id);
    const userAnswer = userAnswers[userAnswers.length - 1];
    if (userAnswer?.submittedText) {
      const isCorrect = checkAnswer(
        userAnswer.submittedText!,
        question.acceptedAnswers,
        question.answerType as "text" | "number"
      );
      if (isCorrect) correct++;

      for (const ans of userAnswers) {
        await prisma.answer.update({
          where: { id: ans.id },
          data: { isCorrect: ans.id === userAnswer.id ? isCorrect : false },
        });
      }
    } else {
      for (const ans of userAnswers) {
        await prisma.answer.update({
          where: { id: ans.id },
          data: { isCorrect: false },
        });
      }
    }
  }

  await prisma.attempt.update({
    where: { id: attempt.id },
    data: { rawScore: correct },
  });

  if (quiz.isPrerequisite) {
    const percentage = (correct / quiz.questions.length) * 100;
    if (percentage >= 70) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { isQualified: true },
      });
    }

    return NextResponse.json({
      submitted: true,
      isPrerequisite: true,
      score: correct,
      total: quiz.questions.length,
      percentage,
      qualified: percentage >= 70,
    });
  }

  await updateOverallScore(session.user.id);

  return NextResponse.json({ submitted: true });
}
