import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getQuiz(id: string) {
  return prisma.quiz.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      biblePortion: true,
      questionCount: true,
      startTime: true,
      endTime: true,
      isPrerequisite: true,
    },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    const { id } = await params;
    const quiz = await getQuiz(id);
    if (!quiz) return { title: "YPE Bible Quiz" };

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://ype-quiz.vercel.app";
    const title = `${quiz.title} · YPE Bible Quiz`;
    const description = `${quiz.biblePortion} · ${quiz.questionCount} questions. Take the weekly Bible quiz by YPE, Mahanaim Church of God, Manchester.`;
    const pageUrl = `${siteUrl}/q/${id}`;

    return {
      title,
      description,
      alternates: { canonical: pageUrl },
      openGraph: {
        type: "article",
        url: pageUrl,
        siteName: "YPE Bible Quiz",
        title,
        description,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      robots: { index: true, follow: true },
    };
  } catch (err) {
    console.error("[q/id] metadata error:", err);
    return { title: "YPE Bible Quiz" };
  }
}

export default async function QuizSharePage({ params }: Params) {
  const { id } = await params;
  const quiz = await getQuiz(id);
  if (!quiz) notFound();

  const session = await auth();
  const now = new Date();
  const isActive = now >= quiz.startTime && now <= quiz.endTime;
  const isClosed = now > quiz.endTime;

  // Logged-in users go straight to the quiz attempt (or its gated state).
  if (session?.user?.id) {
    redirect(`/quiz/${id}`);
  }

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });

  const status = quiz.isPrerequisite
    ? { label: "Qualifying quiz", color: "warning" as const }
    : isActive
    ? { label: "Open now", color: "success" as const }
    : isClosed
    ? { label: "Closed", color: "default" as const }
    : { label: "Upcoming", color: "info" as const };

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 3, sm: 6 },
        py: { xs: 4, md: 8 },
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at 15% 15%, rgba(20,184,166,0.22) 0%, transparent 55%), radial-gradient(circle at 85% 90%, rgba(217,119,6,0.18) 0%, transparent 50%), #0c0a09"
            : "radial-gradient(circle at 15% 15%, rgba(20,184,166,0.15) 0%, transparent 55%), radial-gradient(circle at 85% 90%, rgba(217,119,6,0.12) 0%, transparent 50%), #fafaf9",
      })}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: { xs: 4, md: 5 },
        }}
      >
        <Image src="/logo.png" alt="Mahanaim" width={40} height={40} />
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            Mahanaim
          </Typography>
          <Typography
            sx={{
              color: "primary.main",
              fontWeight: 800,
              fontSize: "0.95rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            YPE Bible Quiz
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: 560,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Chip
          label={status.label}
          color={status.color}
          variant="outlined"
          size="small"
          sx={{ fontWeight: 700, letterSpacing: "0.1em", px: 1 }}
        />
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: "2.25rem", sm: "2.75rem", md: "3.25rem" },
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
          }}
        >
          {quiz.title}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: "1.1rem", sm: "1.25rem" },
            color: "primary.main",
            fontWeight: 600,
          }}
        >
          {quiz.biblePortion}
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: { xs: 1.5, sm: 3 },
            color: "text.secondary",
            mt: 1.5,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <QuizRoundedIcon fontSize="small" />
            <Typography variant="body2">
              {quiz.questionCount} questions
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <AccessTimeRoundedIcon fontSize="small" />
            <Typography variant="body2">
              {fmt(quiz.startTime)} – {fmt(quiz.endTime)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <AutoStoriesRoundedIcon fontSize="small" />
            <Typography variant="body2">Mahanaim · Manchester</Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          href={`/quiz/${id}`}
          variant="contained"
          size="large"
          sx={{ px: 4, py: 1.4, fontSize: "1rem", fontWeight: 700 }}
        >
          {isClosed ? "View quiz" : "Take the quiz"}
        </Button>
        <Typography variant="caption" color="text.secondary">
          You&apos;ll be asked to sign in with Google.
        </Typography>
      </Box>
    </Box>
  );
}
