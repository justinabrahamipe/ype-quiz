"use client";

import { createTheme } from "@mui/material/styles";

export function getMuiTheme(mode: "light" | "dark") {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "dark" ? "#2dd4bf" : "#0f766e",
        light: mode === "dark" ? "#5eead4" : "#14b8a6",
        dark: mode === "dark" ? "#14b8a6" : "#0d6560",
      },
      secondary: {
        main: mode === "dark" ? "#fbbf24" : "#b45309",
      },
      background: {
        default: mode === "dark" ? "#0c0a09" : "#fafaf9",
        paper: mode === "dark" ? "#1c1917" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#e7e5e4" : "#1c1917",
        secondary: mode === "dark" ? "#a8a29e" : "#78716c",
      },
      success: {
        main: mode === "dark" ? "#4ade80" : "#16a34a",
      },
      error: {
        main: mode === "dark" ? "#f87171" : "#dc2626",
      },
      warning: {
        main: mode === "dark" ? "#fbbf24" : "#d97706",
      },
      divider: mode === "dark" ? "#292524" : "#e7e5e4",
    },
    typography: {
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      h4: { fontWeight: 700, letterSpacing: "-0.02em" },
      h5: { fontWeight: 700, letterSpacing: "-0.01em" },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 600 },
      overline: { fontWeight: 600, letterSpacing: "0.08em" },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${mode === "dark" ? "#292524" : "#e7e5e4"}`,
            boxShadow: "none",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none" as const,
            fontWeight: 600,
            borderRadius: 8,
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: "0.75rem",
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            height: 6,
            backgroundColor: mode === "dark" ? "#292524" : "#e7e5e4",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: "none",
          },
        },
      },
    },
  });
}
