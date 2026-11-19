"use client";

import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
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

// Tope por documento de Firestore ≈ 1 MiB. Dejamos margen de seguridad.
const MAX_DOC_BYTES = 700_000;

export async function saveUserData(uid: string, data: Record<string, unknown>): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const payload: Record<string, unknown> = { ...data, updatedAt: Date.now() };

    // Los apuntes subidos (docs) pueden ser enormes (OCR/PDF). Si el total se
    // acerca al límite de Firestore, no los sincronizamos a la nube (siguen en
    // localStorage) para evitar un fallo silencioso que pierda TODO el guardado.
    try {
      const size = JSON.stringify(payload).length;
      if (size > MAX_DOC_BYTES && Array.isArray(payload.docs)) {
        delete payload.docs;
        if (JSON.stringify(payload).length > MAX_DOC_BYTES) {
          // Aún grande sin docs: recorta el historial de errores de quizzes.
          if (Array.isArray(payload.quizErrors)) payload.quizErrors = (payload.quizErrors as unknown[]).slice(0, 30);
        }
      }
    } catch { /* si no se puede medir, intentamos guardar igual */ }

    await setDoc(doc(db, "users", uid), payload, { merge: true });
  } catch (e) {
    console.error("saveUserData error:", e);
  }
}

/** Borra TODOS los datos del usuario en Firestore: su documento de progreso,
 *  la subcolección de chats y su entrada de ranking. (Ejercicio del derecho de
 *  supresión — Ley 1581 de 2012.) */
export async function deleteUserData(uid: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  // Borra la subcolección de chats (los documentos hijos no se borran solos).
  try {
    const chats = await getDocs(collection(db, "users", uid, "chats"));
    await Promise.all(chats.docs.map((d) => deleteDoc(d.ref)));
  } catch (e) {
    console.error("deleteUserData chats error:", e);
  }
  // Borra el documento principal y la entrada de ranking.
  try { await deleteDoc(doc(db, "users", uid)); } catch (e) { console.error("deleteUserData user error:", e); }
  try { await deleteDoc(doc(db, "leaderboard", uid)); } catch { /* puede no existir */ }
}
