"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import { MessageUsLink } from "@/components/message-us-link";

export function HomeContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Box
      sx={(theme) => ({
        position: "relative",
        overflow: "hidden",
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        flexDirection: "column",
        pb: isLoggedIn ? { xs: 8, md: 0 } : 0,
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at 15% 15%, rgba(20,184,166,0.22) 0%, transparent 55%), radial-gradient(circle at 90% 90%, rgba(251,191,36,0.16) 0%, transparent 50%), #0c0a09"
            : "radial-gradient(circle at 15% 15%, rgba(20,184,166,0.18) 0%, transparent 55%), radial-gradient(circle at 90% 90%, rgba(217,119,6,0.14) 0%, transparent 50%), #fafaf9",
      })}
    >
      {/* Decorative rings */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: -120, md: -160 },
          right: { xs: -120, md: -160 },
          width: { xs: 320, md: 460 },
          height: { xs: 320, md: 460 },
          borderRadius: "50%",
          border: "1px dashed",
          borderColor: "secondary.main",
          opacity: 0.25,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: { xs: -140, md: -200 },
          left: { xs: -100, md: -140 },
          width: { xs: 320, md: 460 },
          height: { xs: 320, md: 460 },
          borderRadius: "50%",
          border: "1px solid",
          borderColor: "primary.main",
          opacity: 0.18,
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
          maxWidth: 1100,
          width: "100%",
          mx: "auto",
          px: { xs: 3, sm: 5, md: 8 },
          py: { xs: 6, md: 8 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 760 }}>
          {/* Brand mark */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: { xs: 3, md: 4 } }}>
            <Box sx={{ width: { xs: 40, md: 56 }, height: 3, bgcolor: "secondary.main" }} />
            <Typography
              component="h1"
              sx={{
                color: "secondary.main",
                fontWeight: 900,
                letterSpacing: { xs: "0.1em", md: "0.14em" },
                fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3.25rem" },
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              YPE Bible Quiz
            </Typography>
          </Box>

          {/* Headline */}
          <Typography
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              fontSize: { xs: "2rem", sm: "2.75rem", md: "3.5rem" },
              mb: { xs: 2.5, md: 3 },
            }}
          >
            Read the Word.
            <br />
            <Box component="span" sx={{ color: "primary.main" }}>
              Ten chapters a week.
            </Box>
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mb: { xs: 4, md: 5 },
              fontSize: { xs: "1rem", sm: "1.15rem", md: "1.25rem" },
              lineHeight: 1.55,
              maxWidth: 640,
            }}
          >
            A weekly quiz for the young people of our church, taking us
            through the <b>entire New Testament</b> — ten chapters at a time.
            We&apos;re starting at <b>Matthew 1–10</b>, and a new window
            opens every <b>Wednesday and Thursday</b>. Read along, take the
            quiz, see where you land on the board.
          </Typography>

          {/* Stat strip */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, auto)" },
              gap: { xs: 2.5, sm: 4 },
              mb: { xs: 4, md: 5 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <AutoStoriesRoundedIcon sx={{ color: "primary.main", fontSize: 26 }} />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.1 }}>
                  10 chapters
                </Typography>
                <Typography variant="caption" color="text.secondary">per week</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <AccessTimeRoundedIcon sx={{ color: "secondary.main", fontSize: 26 }} />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.1 }}>
                  Wed &amp; Thu
                </Typography>
                <Typography variant="caption" color="text.secondary">attempt window</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <EmojiEventsRoundedIcon sx={{ color: "primary.main", fontSize: 26 }} />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.1 }}>
                  Matthew
                </Typography>
                <Typography variant="caption" color="text.secondary">starting book</Typography>
              </Box>
            </Box>
          </Box>

          {/* CTA */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: { xs: 4, md: 6 } }}>
            {isLoggedIn ? (
              <Button
                component={Link}
                href="/quizzes"
                variant="contained"
                size="large"
                sx={{ px: 3.5, py: 1.4, fontSize: "1rem" }}
              >
                Go to quizzes
              </Button>
            ) : (
              <>
                <Button
                  component={Link}
                  href="/login"
                  variant="contained"
                  size="large"
                  sx={{ px: 3.5, py: 1.4, fontSize: "1rem" }}
                >
                  Sign in to participate
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Google sign-in · takes a few seconds
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Footer credit */}
      <Box
        sx={{
          position: "relative",
          borderTop: "1px solid",
          borderColor: "divider",
          px: { xs: 3, sm: 5, md: 8 },
          py: { xs: 2.5, md: 2.5 },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: { xs: 1, md: 2 },
          textAlign: { xs: "center", md: "left" },
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          Organised by the{" "}
          <Box component="span" sx={{ color: "primary.main", fontWeight: 700 }}>
            Young People&apos;s Endeavour
          </Box>
          <Box
            component="span"
            sx={{ display: { xs: "block", md: "inline" } }}
          >
            {" "}of{" "}
          </Box>
          <Box component="span" sx={{ fontWeight: 600 }}>
            Mahanaim Church of God, Manchester
          </Box>
        </Typography>
        <MessageUsLink
          label="Questions? Message us"
          subject="YPE Bible Quiz — question"
        />
      </Box>
    </Box>
  );
}
