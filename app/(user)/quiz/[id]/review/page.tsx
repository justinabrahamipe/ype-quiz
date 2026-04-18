import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Header } from "@/components/header";

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

  if (new Date() < quiz.endTime) {
    redirect(`/quiz/${quizId}`);
  }

  const attempt = await prisma.attempt.findUnique({
    where: { quizId_userId: { quizId, userId: session.user.id } },
    include: { answers: true },
  });

  const activeAttempt = attempt?.archivedAt ? null : attempt;

  const answerMap = new Map(
    activeAttempt?.answers.map((a) => [a.questionId, a]) ?? []
  );

  const score = Number(activeAttempt?.rawScore ?? 0);
  const totalQuestions = quiz.questions.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Box
        sx={{
          maxWidth: 720,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 3, md: 5 },
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Box>
          <Button
            component={Link}
            href="/quizzes"
            size="small"
            startIcon={<ArrowBackRoundedIcon />}
            sx={{ color: "text.secondary", mb: 1, px: 0 }}
          >
            Back to quizzes
          </Button>
          <Typography variant="h5" fontWeight={800}>
            {quiz.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {quiz.biblePortion}
          </Typography>
        </Box>

        {activeAttempt && (
          <Card elevation={0} sx={{ bgcolor: "background.paper" }}>
            <CardContent
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                py: 2.5,
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ lineHeight: 1 }}
                >
                  Your score
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ color: "primary.main", fontWeight: 800, mt: 0.5 }}
                >
                  {score}
                  <Box
                    component="span"
                    sx={{
                      color: "text.secondary",
                      fontSize: "1.25rem",
                      fontWeight: 500,
                    }}
                  >
                    {" "}
                    / {totalQuestions}
                  </Box>
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ lineHeight: 1 }}
                >
                  Accuracy
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, mt: 0.5 }}
                >
                  {totalQuestions > 0
                    ? Math.round((score / totalQuestions) * 100)
                    : 0}
                  %
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {quiz.questions.map((q, i) => {
            const ans = answerMap.get(q.id);
            const correct = ans?.isCorrect ?? false;
            const answered = !!ans?.submittedText;
            return (
              <Card
                key={q.id}
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: correct
                    ? "success.main"
                    : answered
                    ? "error.main"
                    : "divider",
                  bgcolor: "background.paper",
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 2,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Question {i + 1}
                    </Typography>
                    <Chip
                      size="small"
                      icon={
                        correct ? (
                          <CheckRoundedIcon />
                        ) : (
                          <CloseRoundedIcon />
                        )
                      }
                      label={correct ? "+1 pt" : "0 pts"}
                      color={correct ? "success" : "default"}
                      variant={correct ? "filled" : "outlined"}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  <Typography sx={{ fontWeight: 500, mb: 1.5 }}>
                    {q.questionText}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ minWidth: 92 }}
                      >
                        Your answer
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: correct
                            ? "success.main"
                            : answered
                            ? "error.main"
                            : "text.secondary",
                          fontStyle: answered ? "normal" : "italic",
                        }}
                      >
                        {ans?.submittedText || "(no answer)"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ minWidth: 92 }}
                      >
                        Correct
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "success.main" }}
                      >
                        {q.acceptedAnswers.join(", ")}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        <Button
          component={Link}
          href="/quizzes"
          variant="outlined"
          size="large"
          startIcon={<ArrowBackRoundedIcon />}
        >
          Back to quizzes
        </Button>
      </Box>
    </div>
  );
}
