import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Deterministic per-seed Fisher–Yates shuffle. Same seed → same order, so a
// user sees the same shuffle across refreshes/resumes.
//
// Seed via cyrb53 (position-aware, so anagram strings don't collide) and use
// mulberry32 for uniform draws. The previous version summed char codes (so
// anagram-equal seeds shuffled identically) and multiplied past 2^53 (so the
// modulo collapsed to predictable values for many seeds), which let one
// question's display position end up paired with a different question's
// shuffled choices for a subset of users.
function cyrb53(str: string): number {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0) ^ (h1 >>> 0);
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deterministicShuffle<T>(items: T[], seedString: string): T[] {
  const rand = mulberry32(cyrb53(seedString));
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

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

  const isStaff =
    session.user.role === "admin" || session.user.role === "quizmaster";

  if (!isStaff && (now < quiz.startTime || now > quiz.endTime)) {
    return NextResponse.json({ error: "Quiz is not active" }, { status: 403 });
  }

  // Non-prerequisite quizzes require the user to be both approved and qualified
  if (!isStaff && !quiz.isPrerequisite) {
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
          secondsPerQuestion: quiz.secondsPerQuestion,
          questions: quiz.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            answerType: q.answerType,
            orderIndex: q.orderIndex,
            maxAnswerLength: q.maxAnswerLength,
            choices:
              q.answerType === "mcq"
                ? deterministicShuffle(q.choices, session.user.id + q.id)
                : [],
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
  const shuffled = deterministicShuffle(quiz.questions, session.user.id + quizId);

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
    secondsPerQuestion: quiz.secondsPerQuestion,
    questions: shuffled.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      answerType: q.answerType,
      orderIndex: q.orderIndex,
      maxAnswerLength: q.maxAnswerLength,
      choices:
        q.answerType === "mcq"
          ? deterministicShuffle(q.choices, session.user.id + q.id)
          : [],
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
