"use client";

import { useMemo } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { useTheme } from "@/lib/theme";
import { getMuiTheme } from "@/lib/mui-theme";

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const muiTheme = useMemo(() => getMuiTheme(theme as "light" | "dark"), [theme]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      {children}
    </MuiThemeProvider>
  );
}
