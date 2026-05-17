import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateBilingualQuestion } from "@/lib/multilang";

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
  const { startTime, endTime, title, biblePortion, questions, secondsPerQuestion, hasMalayalam, isDraft } = body;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  // Publish flow: validate full quiz before flipping isDraft off.
  if (isDraft === false && quiz.isDraft) {
    const allQuestions = await prisma.question.findMany({ where: { quizId }, orderBy: { orderIndex: "asc" } });
    if (allQuestions.length === 0) {
      return NextResponse.json({ error: "Add at least one question before publishing" }, { status: 400 });
    }
    const willHaveMalayalam = hasMalayalam !== undefined ? !!hasMalayalam : quiz.hasMalayalam;
    const willBePrereq = quiz.isPrerequisite;
    const effectiveStart = startTime ? new Date(startTime) : quiz.startTime;
    const effectiveEnd = endTime ? new Date(endTime) : quiz.endTime;
    if (!willBePrereq && effectiveEnd <= effectiveStart) {
      return NextResponse.json({ error: "Set valid start and end times before publishing" }, { status: 400 });
    }
    for (let i = 0; i < allQuestions.length; i++) {
      const q = allQuestions[i];
      if (!q.questionText?.trim()) {
        return NextResponse.json({ error: `Question ${i + 1}: question text is required` }, { status: 400 });
      }
      if (q.answerType === "mcq") {
        if (q.choices.filter((c) => c.trim()).length < 2) {
          return NextResponse.json({ error: `Question ${i + 1}: MCQ needs at least 2 choices` }, { status: 400 });
        }
        if (q.acceptedAnswers.length === 0) {
          return NextResponse.json({ error: `Question ${i + 1}: mark a correct choice` }, { status: 400 });
        }
      } else if (q.acceptedAnswers.length === 0) {
        return NextResponse.json({ error: `Question ${i + 1}: at least one accepted answer required` }, { status: 400 });
      }
      if (willHaveMalayalam) {
        const err = validateBilingualQuestion(q);
        if (err) {
          return NextResponse.json({ error: `Question ${i + 1}: ${err}` }, { status: 400 });
        }
      }
    }
  }

  const nextHasMalayalam = hasMalayalam !== undefined ? !!hasMalayalam : quiz.hasMalayalam;

  // If toggling bilingual on, every existing question must already pass validation
  // (the editor enforces this client-side, but we double-check here).
  if (hasMalayalam === true && !quiz.hasMalayalam) {
    const allQuestions = await prisma.question.findMany({ where: { quizId }, orderBy: { orderIndex: "asc" } });
    for (let i = 0; i < allQuestions.length; i++) {
      const err = validateBilingualQuestion(allQuestions[i]);
      if (err) {
        return NextResponse.json(
          { error: `Question ${i + 1}: ${err}. Fill Malayalam fields before enabling bilingual mode.` },
          { status: 400 }
        );
      }
    }
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
  if (hasMalayalam !== undefined) {
    quizUpdates.hasMalayalam = !!hasMalayalam;
  }
  if (isDraft !== undefined) {
    quizUpdates.isDraft = !!isDraft;
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

      // Validate bilingual constraints on the merged shape
      if (nextHasMalayalam) {
        const existing = await prisma.question.findUnique({ where: { id: q.id } });
        if (!existing) continue;
        const merged = {
          answerType: q.answerType ?? existing.answerType,
          questionText: q.questionText ?? existing.questionText,
          questionTextMl: q.questionTextMl !== undefined ? q.questionTextMl : existing.questionTextMl,
          choices: Array.isArray(q.choices) ? q.choices : existing.choices,
          choicesMl: Array.isArray(q.choicesMl) ? q.choicesMl : existing.choicesMl,
          acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : existing.acceptedAnswers,
          acceptedAnswersMl: Array.isArray(q.acceptedAnswersMl) ? q.acceptedAnswersMl : existing.acceptedAnswersMl,
        };
        const err = validateBilingualQuestion(merged);
        if (err) {
          return NextResponse.json({ error: err }, { status: 400 });
        }
      }

      const questionUpdates: Record<string, unknown> = {};
      if (q.questionText !== undefined) questionUpdates.questionText = q.questionText;
      if (q.questionTextMl !== undefined) {
        questionUpdates.questionTextMl = typeof q.questionTextMl === "string" && q.questionTextMl.trim()
          ? q.questionTextMl.trim()
          : null;
      }
      if (q.acceptedAnswers !== undefined) questionUpdates.acceptedAnswers = q.acceptedAnswers;
      if (q.acceptedAnswersMl !== undefined) {
        questionUpdates.acceptedAnswersMl = Array.isArray(q.acceptedAnswersMl) ? q.acceptedAnswersMl : [];
      }
      if (q.answerType !== undefined) questionUpdates.answerType = q.answerType;
      if (Array.isArray(q.choices)) {
        questionUpdates.choices = q.choices.filter((c: string) => c && c.trim());
      }
      if (Array.isArray(q.choicesMl)) {
        questionUpdates.choicesMl = q.choicesMl.filter((c: string) => c && c.trim());
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
    const { questionText, questionTextMl, answerType, acceptedAnswers, acceptedAnswersMl, choices, choicesMl, maxAnswerLength } = body.addQuestion;

    if (nextHasMalayalam) {
      const err = validateBilingualQuestion({
        answerType,
        questionText,
        questionTextMl,
        choices,
        choicesMl,
        acceptedAnswers,
        acceptedAnswersMl,
      });
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
    }

    const maxOrder = await prisma.question.findFirst({
      where: { quizId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    await prisma.question.create({
      data: {
        quizId,
        questionText,
        questionTextMl: typeof questionTextMl === "string" && questionTextMl.trim() ? questionTextMl.trim() : null,
        answerType: answerType || "mcq",
        acceptedAnswers: acceptedAnswers || [],
        acceptedAnswersMl: Array.isArray(acceptedAnswersMl) ? acceptedAnswersMl : [],
        choices: Array.isArray(choices) ? choices.filter((c: string) => c && c.trim()) : [],
        choicesMl: Array.isArray(choicesMl) ? choicesMl.filter((c: string) => c && c.trim()) : [],
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
