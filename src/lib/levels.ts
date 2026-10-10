import type { Stats } from "./app-context";

// Calcula los puntos de experiencia (XP) a partir de la actividad del usuario.
export function computeXP(stats: Stats): number {
  return (
    stats.questionsAnswered * 5 +
    stats.quizzesTaken * 20 +
    stats.flashcardsReviewed * 2 +
    stats.summariesCreated * 15 +
    stats.focusMinutes * 1 +
    stats.tasksDone * 10
  );
}

// Nivel según XP: cada nivel cuesta progresivamente más.
export function levelInfo(xp: number) {
  // Umbral acumulado para alcanzar el nivel n: 100 * n * (n-1) / 2  (triangular)
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const intoLevel = xp - current;
  const span = next - current;
  const progress = Math.min(Math.max(intoLevel / span, 0), 1);
  return { level, xp, current, next, intoLevel, span, progress, toNext: next - xp };
}

function xpForLevel(n: number): number {
  if (n <= 1) return 0;
  return 50 * (n - 1) * n; // 100, 300, 600, 1000, ...
}
