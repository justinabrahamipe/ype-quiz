import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { EditTimes } from "./edit-times";
import { QuizQuestions } from "./quiz-questions";
import { QuizSubmissions } from "./quiz-submissions";
import { DeleteQuiz } from "./delete-quiz";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "mahanaimype@gmail.com";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "quizmaster")) redirect("/");

  const { id: quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      attempts: {
        where: { isComplete: true, archivedAt: null },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          answers: { select: { id: true, submittedText: true, isCorrect: true, questionId: true } },
        },
        orderBy: { completedAt: "asc" },
      },
    },
  });

  if (!quiz) redirect("/admin");

  const now = new Date();
  const isEditable = now < quiz.startTime;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {quiz.biblePortion}
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className={`grid ${quiz.isPrerequisite ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"} gap-3`}>
          {!quiz.isPrerequisite && (
            <>
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Start</p>
                <p className="text-sm font-medium mt-1">
                  {quiz.startTime.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">End</p>
                <p className="text-sm font-medium mt-1">
                  {quiz.endTime.toLocaleString()}
                </p>
              </div>
            </>
          )}
          <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">Questions</p>
            <p className="text-sm font-medium mt-1">{quiz.questionCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">Submissions</p>
            <p className="text-sm font-medium mt-1">{quiz.attempts.length}</p>
          </div>
        </div>

        {!quiz.isPrerequisite && (
          <EditTimes
            quizId={quizId}
            startTime={quiz.startTime.toISOString()}
            endTime={quiz.endTime.toISOString()}
          />
        )}

        {/* Questions - inline editable */}
        <QuizQuestions
          quizId={quizId}
          questions={quiz.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            answerType: q.answerType,
            acceptedAnswers: q.acceptedAnswers,
            orderIndex: q.orderIndex,
          }))}
        />

        {/* Submissions - expandable with answer editing */}
        <QuizSubmissions
          quizId={quizId}
          canDelete={session.user.role === "admin"}
          submissions={quiz.attempts.map((a) => ({
            attemptId: a.id,
            userId: a.user.id,
            userName: a.user.name || "",
            userEmail: a.user.email,
            userImage: a.user.image,
            completedAt: a.completedAt?.toISOString() || "",
            rawScore: Number(a.rawScore ?? 0),
            answers: a.answers.map((ans) => ({
              id: ans.id,
              submittedText: ans.submittedText,
              isCorrect: ans.isCorrect,
              questionId: ans.questionId,
            })),
          }))}
          questions={quiz.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            acceptedAnswers: q.acceptedAnswers,
            orderIndex: q.orderIndex,
          }))}
        />

        {session.user.email === SUPER_ADMIN_EMAIL && (
          <DeleteQuiz quizId={quizId} quizTitle={quiz.title} />
        )}
      </main>
    </div>
  );
}
