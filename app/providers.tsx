"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
