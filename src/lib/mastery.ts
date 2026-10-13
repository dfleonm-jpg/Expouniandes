// ============================================================
// Motor de dominio adaptativo de Sereno — POR MATERIA y por tema.
//
// Mantiene un "perfil de dominio" por tema (0..100) agrupado por MATERIA
// (ej. Cálculo diferencial, Redes/IP, Estructuras de datos). Se actualiza
// con cada actividad del estudiante usando una media móvil exponencial
// (EMA), de modo que refleja el NIVEL ACTUAL por materia y en general.
//
// Es 100% local y determinista (sin IA): rápido, confiable y auditable.
// ============================================================

import type { MasteryState, MasteryTopic, MasteryLevel, SubjectMastery } from "./types";

export const EMPTY_MASTERY: MasteryState = { topics: {} };

// Peso de la observación nueva frente al histórico. Más alto = reacciona
// más rápido a los cambios recientes (bueno para "se actualiza conforme avanza").
const ALPHA = 0.45;

/** Normaliza un texto para usarlo como clave estable (sin tildes/mayúsculas). */
export function normKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/** Clave compuesta materia::tema (un mismo tema en distintas materias no se mezcla). */
function compositeKey(subject: string, topic: string): string {
  return `${normKey(subject)}::${normKey(topic)}`;
}

function levelFor(score: number): MasteryLevel {
  if (score >= 85) return "dominado";
  if (score >= 65) return "competente";
  if (score >= 40) return "en progreso";
  return "principiante";
}

export type MasteryEntry = { subject: string; topic: string; performance: number };

/**
 * Registra una observación de desempeño (0..100) en un (materia, tema) y
 * devuelve el nuevo estado. No muta el estado recibido.
 */
export function recordMastery(state: MasteryState, subject: string, topic: string, performance: number): MasteryState {
  const subj = (subject || "General").trim();
  const top = (topic || subject || "General").trim();
  const key = compositeKey(subj, top);
  if (!key || key === "::") return state;

  const perf = Math.min(Math.max(performance, 0), 100);
  const prev = state.topics[key];
  const score = prev ? prev.score * (1 - ALPHA) + perf * ALPHA : perf * 0.7 + 50 * 0.3;
  const rounded = Math.round(score);

  const entry: MasteryTopic = {
    topic: key,
    label: prev?.label || top,
    subject: prev?.subject || subj,
    subjectKey: normKey(subj),
    score: rounded,
    attempts: (prev?.attempts ?? 0) + 1,
    lastUpdated: Date.now(),
    level: levelFor(rounded),
  };
  return { topics: { ...state.topics, [key]: entry } };
}

/** Registra varias observaciones de una vez (p. ej. tras un parcial de una materia). */
export function recordMany(state: MasteryState, entries: MasteryEntry[]): MasteryState {
  return entries.reduce((acc, e) => recordMastery(acc, e.subject, e.topic, e.performance), state);
}

/** Lista de temas ordenada por dominio ascendente (débiles primero). */
export function sortedTopics(state: MasteryState): MasteryTopic[] {
  return Object.values(state.topics).sort((a, b) => a.score - b.score);
}

/** Agrupa los temas por MATERIA, con el promedio de dominio de cada una. */
export function subjectBreakdown(state: MasteryState): SubjectMastery[] {
  const groups: Record<string, MasteryTopic[]> = {};
  for (const t of Object.values(state.topics)) {
    (groups[t.subjectKey] ??= []).push(t);
  }
  return Object.entries(groups)
    .map(([subjectKey, topics]) => {
      const sorted = [...topics].sort((a, b) => a.score - b.score);
      const score = Math.round(sorted.reduce((a, t) => a + t.score, 0) / sorted.length);
      return {
        subject: sorted[0].subject,
        subjectKey,
        score,
        level: levelFor(score),
        attempts: sorted.reduce((a, t) => a + t.attempts, 0),
        topics: sorted,
      } as SubjectMastery;
    })
    .sort((a, b) => a.score - b.score); // materias más débiles primero
}

/** Temas débiles (dominio < umbral). */
export function weakTopics(state: MasteryState, threshold = 60): MasteryTopic[] {
  return sortedTopics(state).filter((t) => t.score < threshold);
}

/** Dominio global promedio (0..100), o null si no hay datos. */
export function overallMastery(state: MasteryState): number | null {
  const vals = Object.values(state.topics);
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((a, t) => a + t.score, 0) / vals.length);
}

export { levelFor };

/** Convierte una nota 0..5 (Uniandes) a desempeño 0..100. */
export const score5ToPerf = (s: number) => Math.min(Math.max((s / 5) * 100, 0), 100);
/** Convierte aciertos/total a desempeño 0..100. */
export const ratioToPerf = (correct: number, total: number) =>
  total > 0 ? Math.min(Math.max((correct / total) * 100, 0), 100) : 0;
