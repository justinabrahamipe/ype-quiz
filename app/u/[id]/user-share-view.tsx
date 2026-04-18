"use client";

import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

type Props = {
  name: string;
  image: string | null;
  rank: number;
  totalMembers: number;
  score: number;
  quizzesAttempted: number;
};

export function UserShareView({
  name,
  image,
  rank,
  totalMembers,
  score,
  quizzesAttempted,
}: Props) {
  const accent =
    rank === 1
      ? "#fbbf24"
      : rank === 2
      ? "#94a3b8"
      : rank === 3
      ? "#d97706"
      : "primary.main";

  const rankLabel =
    rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `#${rank}`;

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
          maxWidth: 520,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          src={image || undefined}
          sx={{
            width: 120,
            height: 120,
            fontSize: "3rem",
            border: "4px solid",
            borderColor: typeof accent === "string" && accent.startsWith("#") ? accent : "primary.main",
            bgcolor: !image ? "primary.main" : undefined,
          }}
        >
          {!image && (name[0] || "?").toUpperCase()}
        </Avatar>

        <Typography
          component="h1"
          sx={{
            fontSize: { xs: "2rem", sm: "2.5rem", md: "2.75rem" },
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
          }}
        >
          {name}
        </Typography>

        {rank > 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "text.secondary",
            }}
          >
            <EmojiEventsRoundedIcon
              sx={{
                color: typeof accent === "string" && accent.startsWith("#") ? accent : "primary.main",
              }}
            />
            <Typography variant="body1">
              Ranked{" "}
              <Box
                component="span"
                sx={{
                  color: typeof accent === "string" && accent.startsWith("#") ? accent : "primary.main",
                  fontWeight: 800,
                }}
              >
                {rankLabel}
              </Box>{" "}
              of {totalMembers} member{totalMembers === 1 ? "" : "s"}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Just getting started
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            gap: { xs: 2, sm: 4 },
            mt: 2,
            mb: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <TrendingUpRoundedIcon
              fontSize="small"
              sx={{ color: "primary.main" }}
            />
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 700 }}>
                {score}
              </Box>{" "}
              points
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <CheckCircleRoundedIcon
              fontSize="small"
              sx={{ color: "success.main" }}
            />
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 700 }}>
                {quizzesAttempted}
              </Box>{" "}
              {quizzesAttempted === 1 ? "quiz" : "quizzes"} taken
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          href="/"
          variant="contained"
          size="large"
          sx={{ px: 4, py: 1.4, fontSize: "1rem", fontWeight: 700 }}
        >
          Join the YPE Bible Quiz
        </Button>
        <Typography variant="caption" color="text.secondary">
          Weekly Bible quiz · Wed &amp; Thu · Mahanaim Church of God
        </Typography>
      </Box>
    </Box>
  );
}
