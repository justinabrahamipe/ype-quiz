import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { getQuizRank } from "@/lib/rank";
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

  if (quiz.isPrerequisite) {
    // Prerequisite quiz: show the review page as soon as it's submitted, so
    // the user sees their pass/fail straight away.
    if (!activeAttempt?.isComplete) {
      redirect(`/quiz/${quizId}`);
    }
  } else if (new Date() < quiz.endTime) {
    // Regular quiz, window still open: results aren't published yet, so show
    // the "submitted" confirmation if they've finished, otherwise send them
    // to the attempt page.
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

  // Per-quiz rank is only meaningful for regular quizzes.
  const { rank, tiedCount, totalAttempts } =
    activeAttempt && !quiz.isPrerequisite
      ? await getQuizRank(quizId, score, true)
      : { rank: 0, tiedCount: 0, totalAttempts: 0 };

  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = quiz.isPrerequisite ? percentage >= 70 : null;

  const dbUser = quiz.isPrerequisite
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isQualified: true },
      })
    : null;
  const needsRetry = quiz.isPrerequisite && !dbUser?.isQualified;

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
        quizId={quizId}
        title={quiz.title}
        biblePortion={quiz.biblePortion}
        score={score}
        totalQuestions={totalQuestions}
        hasAttempt={!!activeAttempt}
        isPrerequisite={quiz.isPrerequisite}
        passed={passed}
        needsRetry={needsRetry}
        rank={rank}
        totalAttempts={totalAttempts}
        tiedCount={tiedCount}
        questions={questions}
      />
    </div>
  );
}
