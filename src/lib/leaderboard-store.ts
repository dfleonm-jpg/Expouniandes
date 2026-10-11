"use client";

import { collection, doc, setDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getDb } from "./firebase";

// Entradas del ranking en una colección pública de solo lectura:
//   leaderboard/{uid} -> { name, xp, level, photo, updatedAt }

export type LeaderEntry = {
  uid: string;
  name: string;
  xp: number;
  level: number;
  photo?: string | null;
  updatedAt: number;
};

export async function publishScore(entry: Omit<LeaderEntry, "updatedAt">): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await setDoc(doc(db, "leaderboard", entry.uid), { ...entry, updatedAt: Date.now() }, { merge: true });
  } catch (e) {
    console.error("publishScore error:", e);
  }
}

export async function getLeaderboard(top = 20): Promise<LeaderEntry[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const q = query(collection(db, "leaderboard"), orderBy("xp", "desc"), limit(top));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LeaderEntry);
  } catch (e) {
    console.error("getLeaderboard error:", e);
    return [];
  }
}
