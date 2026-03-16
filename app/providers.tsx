"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/lib/theme";
import { ThemeRegistry } from "@/lib/theme-registry";
import { Toaster } from "@/components/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ThemeRegistry>
          {children}
          <Toaster />
        </ThemeRegistry>
      </ThemeProvider>
    </SessionProvider>
  );
}
