"use client";

import { doc, getDoc, setDoc, increment } from "firebase/firestore";
import { getDb } from "./firebase";

// Métricas globales acumuladas de toda la comunidad (para el panel de impacto).
//   metrics/global -> { focusMinutes, quizzes, questions, summaries, flashcards }

export type GlobalMetrics = {
  focusMinutes: number;
  quizzes: number;
  questions: number;
  summaries: number;
  flashcards: number;
};

const EMPTY: GlobalMetrics = { focusMinutes: 0, quizzes: 0, questions: 0, summaries: 0, flashcards: 0 };

export async function getGlobalMetrics(): Promise<GlobalMetrics> {
  const db = getDb();
  if (!db) return EMPTY;
  try {
    const snap = await getDoc(doc(db, "metrics", "global"));
    return snap.exists() ? { ...EMPTY, ...(snap.data() as GlobalMetrics) } : EMPTY;
  } catch (e) {
    console.error("getGlobalMetrics error:", e);
    return EMPTY;
  }
}

/** Suma de forma atómica a los contadores globales. */
export async function bumpGlobalMetrics(delta: Partial<GlobalMetrics>): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(delta)) {
      if (v) payload[k] = increment(v as number);
    }
    if (Object.keys(payload).length === 0) return;
    await setDoc(doc(db, "metrics", "global"), payload, { merge: true });
  } catch (e) {
    console.error("bumpGlobalMetrics error:", e);
  }
}
