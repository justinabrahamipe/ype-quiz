import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AnswerType } from "@prisma/client";
import { validateBilingualQuestion } from "@/lib/multilang";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "quizmaster")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { title, biblePortion, startDateTime, endDateTime, questionCount, questions, isPrerequisite, secondsPerQuestion, hasMalayalam, isDraft } = body;

  type IncomingQuestion = {
    questionText: string;
    questionTextMl?: string | null;
    answerType: string;
    acceptedAnswers: string[];
    acceptedAnswersMl?: string[];
    choices?: string[];
    choicesMl?: string[];
    maxAnswerLength?: number | null;
  };
  const draft = !!isDraft;
  const questionList: IncomingQuestion[] = Array.isArray(questions) ? questions : [];

  if (!title || !biblePortion) {
    return NextResponse.json({ error: "Title and bible portion are required" }, { status: 400 });
  }

  if (!draft) {
    if (!startDateTime || !endDateTime || !questionCount || !questionList.length) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
  }

  const start = startDateTime ? new Date(startDateTime) : new Date();
  // Drafts may not have an end time yet; we use a placeholder a year out so
  // existing time-based queries keep working (drafts are hidden anyway).
  const end = endDateTime
    ? new Date(endDateTime)
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  if (!draft && end <= start) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  const normalizedSeconds =
    secondsPerQuestion != null && Number.isFinite(secondsPerQuestion) && secondsPerQuestion > 0
      ? Math.floor(secondsPerQuestion)
      : 120;

  if (!draft && hasMalayalam) {
    for (let i = 0; i < questionList.length; i++) {
      const err = validateBilingualQuestion(questionList[i]);
      if (err) {
        return NextResponse.json({ error: `Question ${i + 1}: ${err}` }, { status: 400 });
      }
    }
  }

  const appSettings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  const currentSeason = appSettings?.currentSeason ?? 1;

  const quiz = await prisma.quiz.create({
    data: {
      title,
      biblePortion,
      startTime: start,
      endTime: end,
      questionCount: questionCount ?? questionList.length,
      secondsPerQuestion: normalizedSeconds,
      isPrerequisite: !!isPrerequisite,
      hasMalayalam: !!hasMalayalam,
      isDraft: draft,
      season: currentSeason,
      createdBy: session.user.id,
      questions: {
        create: questionList.map((q, i) => ({
          questionText: q.questionText ?? "",
          questionTextMl: hasMalayalam ? (q.questionTextMl?.trim() || null) : null,
          answerType: (q.answerType || "mcq") as AnswerType,
          acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : [],
          acceptedAnswersMl: hasMalayalam && Array.isArray(q.acceptedAnswersMl) ? q.acceptedAnswersMl : [],
          choices: Array.isArray(q.choices) ? q.choices.filter((c) => c.trim()) : [],
          choicesMl: hasMalayalam && Array.isArray(q.choicesMl) ? q.choicesMl.filter((c) => c.trim()) : [],
          orderIndex: i,
          maxAnswerLength:
            q.maxAnswerLength != null && Number.isFinite(q.maxAnswerLength) && q.maxAnswerLength > 0
              ? Math.floor(q.maxAnswerLength)
              : null,
        })),
      },
    },
    include: { questions: true },
  });

  return NextResponse.json({ id: quiz.id, created: true });
}
