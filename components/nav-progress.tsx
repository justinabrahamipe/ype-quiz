"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LinearProgress from "@mui/material/LinearProgress";

export function NavProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPathRef = useRef(pathname);

  // Hide when the pathname has settled after a navigation.
  useEffect(() => {
    if (currentPathRef.current !== pathname) {
      currentPathRef.current = pathname;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setVisible(false), 120);
    }
  }, [pathname]);

  // Start the bar on link clicks that will navigate in-app.
  useEffect(() => {
    const start = () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setVisible(true);
      // Safety: don't keep the bar forever if something goes wrong
      hideTimerRef.current = setTimeout(() => setVisible(false), 8000);
    };

    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (href.startsWith("#")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        // Skip same-page link (path + search + hash match)
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
      } catch {
        return;
      }

      start();
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!visible) return null;
  return (
    <LinearProgress
      aria-label="Loading"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 2000,
        backgroundColor: "transparent",
        "& .MuiLinearProgress-bar": {
          bgcolor: "primary.main",
        },
      }}
    />
  );
}
