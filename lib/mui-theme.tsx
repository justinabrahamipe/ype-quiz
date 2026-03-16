"use client";

import { createTheme } from "@mui/material/styles";

export function getMuiTheme(mode: "light" | "dark") {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#6366f1",
        light: "#818cf8",
        dark: "#4f46e5",
      },
      secondary: {
        main: "#8b5cf6",
        light: "#a78bfa",
        dark: "#7c3aed",
      },
      background: {
        default: mode === "dark" ? "#0b0f1a" : "#f0f2f5",
        paper: mode === "dark" ? "#141828" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#e2e8f0" : "#1a1a2e",
        secondary: mode === "dark" ? "#94a3b8" : "#64748b",
      },
      success: {
        main: "#10b981",
      },
      error: {
        main: "#ef4444",
      },
      warning: {
        main: "#f59e0b",
      },
    },
    typography: {
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${mode === "dark" ? "#1e293b" : "#e2e8f0"}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none" as const,
            fontWeight: 600,
            borderRadius: 10,
          },
          containedPrimary: {
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
            "&:hover": {
              boxShadow: "0 4px 16px rgba(99, 102, 241, 0.4)",
            },
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
            height: 8,
          },
        },
      },
    },
  });
}
