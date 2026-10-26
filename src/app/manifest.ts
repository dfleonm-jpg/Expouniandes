import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sereno — Tutor con IA para estudiar sin estrés",
    short_name: "Sereno",
    description:
      "Tutor académico con IA: resuelve dudas, genera quizzes y parciales, flashcards, resúmenes, planifica tu tiempo y cuida tu bienestar. ExpoUniandes.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#060910",
    theme_color: "#3b6fe5",
    orientation: "portrait",
    lang: "es",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
    // Atajos: aparecen al mantener presionado el ícono de la app instalada.
    shortcuts: [
      { name: "Tutor IA", short_name: "Tutor", url: "/#tutor", description: "Pregúntale al tutor" },
      { name: "Parcial", short_name: "Parcial", url: "/#exam", description: "Practica un parcial" },
      { name: "Parcial abierto", short_name: "Abierto", url: "/#openExam", description: "Parcial de respuesta abierta" },
      { name: "Bienestar", short_name: "Bienestar", url: "/#wellbeing", description: "Respira y relájate" },
    ],
  };
}
