// ============================================================
// Motor de dominio adaptativo de Sereno.
//
// Mantiene un "perfil de dominio" por tema (0..100) que se actualiza
// con cada actividad del estudiante (quiz, parcial, práctica de código/
// cálculo, parcial abierto). Usa una media móvil exponencial (EMA) para
// que el valor refleje el NIVEL ACTUAL y no el histórico completo: si el
// estudiante mejora, su dominio sube; si falla, baja.
//
// Es 100% local y determinista (sin IA): rápido, confiable y auditable.
// ============================================================

import type { MasteryState, MasteryTopic } from "./types";

export const EMPTY_MASTERY: MasteryState = { topics: {} };

// Peso de la observación nueva frente al histórico. Más alto = reacciona
// más rápido a los cambios recientes (bueno para "se actualiza conforme avanza").
const ALPHA = 0.45;

/** Normaliza un nombre de tema para usarlo como clave estable. */
export function topicKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/\s+/g, " ");
}

function levelFor(score: number): MasteryTopic["level"] {
  if (score >= 85) return "dominado";
  if (score >= 65) return "competente";
  if (score >= 40) return "en progreso";
  return "principiante";
}

/**
 * Registra una observación de desempeño (0..100) en un tema y devuelve el
 * nuevo estado. No muta el estado recibido.
 */
export function recordMastery(state: MasteryState, label: string, performance: number): MasteryState {
  const key = topicKey(label);
  if (!key) return state;
  const perf = Math.min(Math.max(performance, 0), 100);
  const prev = state.topics[key];

  // Primera observación: arranca en la propia observación (con ligero sesgo
  // al centro para no sobre-reaccionar a un único acierto/fallo).
  const score = prev ? prev.score * (1 - ALPHA) + perf * ALPHA : perf * 0.7 + 50 * 0.3;
  const rounded = Math.round(score);

  const topic: MasteryTopic = {
    topic: key,
    label: prev?.label || label.trim(),
    score: rounded,
    attempts: (prev?.attempts ?? 0) + 1,
    lastUpdated: Date.now(),
    level: levelFor(rounded),
  };
  return { topics: { ...state.topics, [key]: topic } };
}

/** Registra varias observaciones de una vez (p. ej. tras un parcial). */
export function recordMany(state: MasteryState, entries: { label: string; performance: number }[]): MasteryState {
  return entries.reduce((acc, e) => recordMastery(acc, e.label, e.performance), state);
}

/** Lista de temas ordenada por dominio ascendente (débiles primero). */
export function sortedTopics(state: MasteryState): MasteryTopic[] {
  return Object.values(state.topics).sort((a, b) => a.score - b.score);
}

/** Temas débiles (dominio < umbral), con al menos 1 intento. */
export function weakTopics(state: MasteryState, threshold = 60): MasteryTopic[] {
  return sortedTopics(state).filter((t) => t.score < threshold);
}

/** Temas fuertes (dominio >= umbral). */
export function strongTopics(state: MasteryState, threshold = 75): MasteryTopic[] {
  return sortedTopics(state)
    .filter((t) => t.score >= threshold)
    .reverse();
}

/** Dominio global promedio (0..100), o null si no hay datos. */
export function overallMastery(state: MasteryState): number | null {
  const vals = Object.values(state.topics);
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((a, t) => a + t.score, 0) / vals.length);
}

/** Convierte una nota 0..5 (Uniandes) a desempeño 0..100. */
export const score5ToPerf = (s: number) => Math.min(Math.max((s / 5) * 100, 0), 100);
/** Convierte aciertos/total a desempeño 0..100. */
export const ratioToPerf = (correct: number, total: number) =>
  total > 0 ? Math.min(Math.max((correct / total) * 100, 0), 100) : 0;
