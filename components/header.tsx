"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/lib/theme";
import Link from "next/link";
import Image from "next/image";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import { usePathname } from "next/navigation";
import { InstallButton } from "@/components/install-button";

export function Header() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        backdropFilter: "blur(12px)",
        backgroundColor: (t) =>
          t.palette.mode === "dark"
            ? "rgba(20, 24, 40, 0.85)"
            : "rgba(255, 255, 255, 0.85)",
      }}
    >
      <Toolbar sx={{ maxWidth: 900, width: "100%", mx: "auto", px: { xs: 1, sm: 2 }, minHeight: "56px !important" }}>
        {/* Logo */}
        <Box
          component={Link}
          href="/"
          sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none", mr: 3 }}
        >
          <Image src="/logo.png" alt="Mahanaim" width={28} height={28} />
          <Typography
            variant="h6"
            sx={{
              color: "primary.main",
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
              letterSpacing: "-0.01em",
            }}
          >
            Mahanaim Bible Quiz
          </Typography>
        </Box>

        {/* Desktop nav links */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", justifyContent: "space-between", gap: 0.5, flexGrow: 1, mx: 2 }}>
          <Button
            component={Link}
            href="/quizzes"
            size="small"
            startIcon={<QuizRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: pathname === "/quizzes" ? "primary.main" : "text.secondary",
              fontWeight: pathname === "/quizzes" ? 600 : 400,
              fontSize: "0.8rem",
            }}
          >
            Quizzes
          </Button>
          <Button
            component={Link}
            href="/you"
            size="small"
            startIcon={<PersonRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: pathname === "/you" ? "primary.main" : "text.secondary",
              fontWeight: pathname === "/you" ? 600 : 400,
              fontSize: "0.8rem",
            }}
          >
            You
          </Button>
          <Button
            component={Link}
            href="/leaderboard"
            size="small"
            startIcon={<PeopleRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: pathname === "/leaderboard" ? "primary.main" : "text.secondary",
              fontWeight: pathname === "/leaderboard" ? 600 : 400,
              fontSize: "0.8rem",
            }}
          >
            Leaderboard
          </Button>
        </Box>

        {/* Spacer for mobile */}
        <Box sx={{ flexGrow: 1, display: { xs: "block", md: "none" } }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <InstallButton />
          <IconButton
            onClick={toggleTheme}
            size="small"
            aria-label="Toggle theme"
            sx={{
              color: "primary.main",
              width: 36,
              height: 36,
              borderRadius: 2,
            }}
          >
            {theme === "dark" ? (
              <LightModeRoundedIcon fontSize="small" />
            ) : (
              <DarkModeRoundedIcon fontSize="small" />
            )}
          </IconButton>

          {session?.user && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                ml: 1,
                pl: 1,
                borderLeft: "1px solid",
                borderColor: "divider",
              }}
            >
              {(session.user.role === "admin" ||
                session.user.role === "quizmaster") && (
                <Chip
                  component={Link}
                  href="/admin"
                  label={
                    session.user.role === "quizmaster" ? "Quizmaster" : "Admin"
                  }
                  size="small"
                  color="primary"
                  variant="outlined"
                  clickable
                  sx={{
                    fontSize: "0.7rem",
                    height: 24,
                    fontWeight: 600,
                  }}
                />
              )}
              <Avatar
                src={session.user.image || undefined}
                alt={session.user.name || ""}
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: "0.85rem",
                  border: "2px solid",
                  borderColor: "divider",
                }}
              >
                {!session.user.image &&
                  (session.user.name || "?")[0].toUpperCase()}
              </Avatar>
              <IconButton
                onClick={() => signOut()}
                size="small"
                aria-label="Sign out"
                sx={{
                  color: "text.secondary",
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                }}
              >
                <LogoutRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          {!session?.user && (
            <Button
              component={Link}
              href="/login"
              variant="contained"
              size="small"
              sx={{ fontSize: "0.75rem", ml: 1 }}
            >
              Sign in
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
