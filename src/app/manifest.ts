import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sereno — Tutor con IA para estudiar sin estrés",
    short_name: "Sereno",
    description:
      "Tutor académico con IA: resuelve dudas, genera quizzes y parciales, flashcards, resúmenes, planifica tu tiempo y cuida tu bienestar. ExpoUniandes.",
    start_url: "/",
    display: "standalone",
    background_color: "#07070b",
    theme_color: "#8b5cf6",
    orientation: "portrait",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}
