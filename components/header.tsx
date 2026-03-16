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
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5, flexGrow: 1 }}>
          <Button
            component={Link}
            href="/"
            size="small"
            startIcon={<QuizRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: pathname === "/" ? "primary.main" : "text.secondary",
              fontWeight: pathname === "/" ? 600 : 400,
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
            href="/members"
            size="small"
            startIcon={<PeopleRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: pathname === "/members" ? "primary.main" : "text.secondary",
              fontWeight: pathname === "/members" ? 600 : 400,
              fontSize: "0.8rem",
            }}
          >
            Members
          </Button>
        </Box>

        {/* Spacer for mobile */}
        <Box sx={{ flexGrow: 1, display: { xs: "block", md: "none" } }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            onClick={toggleTheme}
            size="small"
            sx={{ color: "primary.main" }}
          >
            {theme === "dark" ? (
              <LightModeRoundedIcon fontSize="small" />
            ) : (
              <DarkModeRoundedIcon fontSize="small" />
            )}
          </IconButton>

          {(session?.user?.role === "admin" || session?.user?.role === "quizmaster") && (
            <Chip
              component={Link}
              href="/admin"
              label={session?.user?.role === "quizmaster" ? "Quizmaster" : "Admin"}
              size="small"
              color="primary"
              variant="outlined"
              clickable
              sx={{ fontSize: "0.7rem", height: 26 }}
            />
          )}

          {session?.user && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 0.5 }}>
              <Avatar
                src={session.user.image || undefined}
                alt={session.user.name || ""}
                sx={{ width: 30, height: 30, border: "2px solid", borderColor: "divider" }}
              />
              <IconButton
                onClick={() => signOut()}
                size="small"
                sx={{ color: "text.secondary" }}
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
              sx={{ fontSize: "0.75rem" }}
            >
              Sign in
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
