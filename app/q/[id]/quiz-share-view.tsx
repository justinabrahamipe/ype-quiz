"use client";

import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";

type ChipColor =
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning";

type Props = {
  id: string;
  title: string;
  biblePortion: string;
  questionCount: number;
  startTime: string;
  endTime: string;
  statusLabel: string;
  statusColor: ChipColor;
  isClosed: boolean;
};

export function QuizShareView({
  id,
  title,
  biblePortion,
  questionCount,
  startTime,
  endTime,
  statusLabel,
  statusColor,
  isClosed,
}: Props) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });

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
          label={statusLabel}
          color={statusColor}
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
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: "1.1rem", sm: "1.25rem" },
            color: "primary.main",
            fontWeight: 600,
          }}
        >
          {biblePortion}
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
            <Typography variant="body2">{questionCount} questions</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <AccessTimeRoundedIcon fontSize="small" />
            <Typography variant="body2">
              {fmt(startTime)} – {fmt(endTime)}
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
