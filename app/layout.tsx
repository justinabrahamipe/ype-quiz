import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ype-quiz.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "YPE Bible Quiz · Mahanaim Church of God",
  description:
    "A weekly Bible quiz by the Young People's Endeavour of Mahanaim Church of God, Manchester. 10 chapters a week, attempts on Wednesday & Thursday — starting from Matthew 1–10.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "YPE Bible Quiz",
    title: "YPE Bible Quiz · Mahanaim Church of God",
    description:
      "A weekly Bible quiz by YPE, Mahanaim Church of God, Manchester. 10 chapters a week. Wed & Thu.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "YPE Bible Quiz",
    description:
      "A weekly Bible quiz by YPE, Mahanaim Church of God, Manchester.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
