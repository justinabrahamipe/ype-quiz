import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { ReviewView } from "./review-view";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  if (!quiz) redirect("/");

  const attempt = await prisma.attempt.findUnique({
    where: { quizId_userId: { quizId, userId: session.user.id } },
    include: { answers: true },
  });

  const activeAttempt = attempt?.archivedAt ? null : attempt;

  // Quiz window still open: results aren't published yet, so show the
  // "submitted" confirmation (if they've already finished) or send them to the
  // attempt page.
  if (new Date() < quiz.endTime) {
    if (activeAttempt?.isComplete) {
      redirect(`/quiz/${quizId}/submitted`);
    }
    redirect(`/quiz/${quizId}`);
  }

  const answerMap = new Map(
    activeAttempt?.answers.map((a) => [a.questionId, a]) ?? []
  );

  const score = Number(activeAttempt?.rawScore ?? 0);
  const totalQuestions = quiz.questions.length;

  let rank = 0;
  let totalAttempts = 0;
  let tiedCount = 0;
  if (activeAttempt) {
    const [higher, same, all] = await Promise.all([
      prisma.attempt.count({
        where: {
          quizId,
          isComplete: true,
          archivedAt: null,
          rawScore: { gt: score },
        },
      }),
      prisma.attempt.count({
        where: {
          quizId,
          isComplete: true,
          archivedAt: null,
          rawScore: score,
        },
      }),
      prisma.attempt.count({
        where: { quizId, isComplete: true, archivedAt: null },
      }),
    ]);
    rank = higher + 1;
    tiedCount = Math.max(0, same - 1);
    totalAttempts = all;
  }

  const questions = quiz.questions.map((q) => {
    const a = answerMap.get(q.id);
    return {
      id: q.id,
      questionText: q.questionText,
      acceptedAnswers: q.acceptedAnswers,
      submittedText: a?.submittedText ?? null,
      isCorrect: a?.isCorrect ?? false,
      answered: !!a?.submittedText,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ReviewView
        title={quiz.title}
        biblePortion={quiz.biblePortion}
        score={score}
        totalQuestions={totalQuestions}
        hasAttempt={!!activeAttempt}
        rank={rank}
        totalAttempts={totalAttempts}
        tiedCount={tiedCount}
        questions={questions}
      />
    </div>
  );
}
