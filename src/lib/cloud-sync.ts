"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";

// Lee/escribe el documento de progreso del usuario en Firestore:
//   users/{uid}  →  { stats, examHistory, examEvents, streak, userName, ... }

export async function loadUserData(uid: string): Promise<Record<string, unknown> | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
  } catch (e) {
    console.error("loadUserData error:", e);
    return null;
  }
}

export async function saveUserData(uid: string, data: Record<string, unknown>): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await setDoc(doc(db, "users", uid), { ...data, updatedAt: Date.now() }, { merge: true });
  } catch (e) {
    console.error("saveUserData error:", e);
  }
}
