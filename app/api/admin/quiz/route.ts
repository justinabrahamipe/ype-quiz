import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AnswerType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "quizmaster")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { title, biblePortion, startDateTime, endDateTime, questionCount, questions, isPrerequisite, secondsPerQuestion } = body;

  if (!title || !biblePortion || !startDateTime || !endDateTime || !questionCount || !questions?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (end <= start) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  const normalizedSeconds =
    secondsPerQuestion != null && Number.isFinite(secondsPerQuestion) && secondsPerQuestion > 0
      ? Math.floor(secondsPerQuestion)
      : 120;

  const quiz = await prisma.quiz.create({
    data: {
      title,
      biblePortion,
      startTime: start,
      endTime: end,
      questionCount,
      secondsPerQuestion: normalizedSeconds,
      isPrerequisite: !!isPrerequisite,
      createdBy: session.user.id,
      questions: {
        create: questions.map(
          (
            q: {
              questionText: string;
              answerType: string;
              acceptedAnswers: string[];
              choices?: string[];
              maxAnswerLength?: number | null;
            },
            i: number
          ) => ({
            questionText: q.questionText,
            answerType: q.answerType as AnswerType,
            acceptedAnswers: q.acceptedAnswers,
            choices: Array.isArray(q.choices) ? q.choices.filter((c) => c.trim()) : [],
            orderIndex: i,
            maxAnswerLength:
              q.maxAnswerLength != null && Number.isFinite(q.maxAnswerLength) && q.maxAnswerLength > 0
                ? Math.floor(q.maxAnswerLength)
                : null,
          })
        ),
      },
    },
    include: { questions: true },
  });

  return NextResponse.json({ id: quiz.id, created: true });
}
