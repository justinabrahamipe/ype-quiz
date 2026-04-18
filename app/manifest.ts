import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YPE Bible Quiz · Mahanaim",
    short_name: "YPE Quiz",
    description:
      "Weekly Bible Quiz — Young People's Endeavour, Mahanaim Church of God, Manchester.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c0a09",
    theme_color: "#0c0a09",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    categories: ["education", "books"],
  };
}
