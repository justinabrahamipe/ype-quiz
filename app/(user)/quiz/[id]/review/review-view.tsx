"use client";

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

type QuestionReview = {
  id: string;
  questionText: string;
  acceptedAnswers: string[];
  submittedText: string | null;
  isCorrect: boolean;
  answered: boolean;
};

type Props = {
  title: string;
  biblePortion: string;
  score: number;
  totalQuestions: number;
  hasAttempt: boolean;
  rank: number;
  totalAttempts: number;
  tiedCount: number;
  questions: QuestionReview[];
};

export function ReviewView({
  title,
  biblePortion,
  score,
  totalQuestions,
  hasAttempt,
  rank,
  totalAttempts,
  tiedCount,
  questions,
}: Props) {
  return (
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
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {biblePortion}
        </Typography>
      </Box>

      {hasAttempt && (
        <Card elevation={0} sx={{ bgcolor: "background.paper" }}>
          <CardContent
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
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
                Score
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
                    fontSize: "1.1rem",
                    fontWeight: 500,
                  }}
                >
                  {" "}
                  / {totalQuestions}
                </Box>
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ lineHeight: 1 }}
              >
                Accuracy
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                {totalQuestions > 0
                  ? Math.round((score / totalQuestions) * 100)
                  : 0}
                %
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ lineHeight: 1 }}
              >
                Rank
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, mt: 0.5, color: "primary.main" }}
              >
                {rank > 0 ? `#${rank}` : "—"}
                {totalAttempts > 0 && (
                  <Box
                    component="span"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    {" "}
                    / {totalAttempts}
                  </Box>
                )}
              </Typography>
              {tiedCount > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.25 }}
                >
                  Tied with {tiedCount} {tiedCount === 1 ? "other" : "others"}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {questions.map((q, i) => (
          <Card
            key={q.id}
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: q.isCorrect
                ? "success.main"
                : q.answered
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
                  icon={q.isCorrect ? <CheckRoundedIcon /> : <CloseRoundedIcon />}
                  label={q.isCorrect ? "+1 pt" : "0 pts"}
                  color={q.isCorrect ? "success" : "default"}
                  variant={q.isCorrect ? "filled" : "outlined"}
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              <Typography sx={{ fontWeight: 500, mb: 1.5 }}>
                {q.questionText}
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
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
                      color: q.isCorrect
                        ? "success.main"
                        : q.answered
                        ? "error.main"
                        : "text.secondary",
                      fontStyle: q.answered ? "normal" : "italic",
                    }}
                  >
                    {q.submittedText || "(no answer)"}
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
        ))}
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
  );
}
