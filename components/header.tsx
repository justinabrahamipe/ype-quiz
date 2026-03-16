"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/lib/theme";
import Link from "next/link";
import Image from "next/image";

export function Header() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--card)]/80 glass">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold gradient-text">
          BibleQuiz
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--accent-soft)] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg className="w-[18px] h-[18px] text-[var(--accent-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px] text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {session?.user?.role === "admin" && (
            <Link
              href="/admin"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              Admin
            </Link>
          )}

          {session?.user && (
            <div className="flex items-center gap-2 ml-1">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  width={30}
                  height={30}
                  className="rounded-full ring-2 ring-[var(--card-border)]"
                />
              )}
              <button
                onClick={() => signOut()}
                className="text-xs text-[var(--muted)] hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}

          {!session?.user && (
            <Link
              href="/login"
              className="btn-primary text-xs !py-1.5 !px-4"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
