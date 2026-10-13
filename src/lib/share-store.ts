"use client";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "./firebase";

// ============================================================
// Sistema de códigos para compartir (grupos de estudio).
//
// En vez de meter TODO el contenido dentro de un código gigante
// (lo que fallaba), guardamos el recurso en Firestore bajo un
// CÓDIGO CORTO legible (ej. "SER-7K2P"). Compartir = pasar 7
// caracteres; unirse = pegarlos y traer el contenido.
//
//   shares/{CODE} -> { type, title, data, createdAt, owner }
// ============================================================

export type ShareType = "summary" | "quiz" | "flashcards" | "plan";
export type SharedResource = {
  code: string;
  type: ShareType;
  title: string;
  data: unknown;
  owner?: string | null;
  createdAt?: number;
};

// Alfabeto sin caracteres ambiguos (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Genera un código corto tipo "SER-7K2P". */
export function makeCode(): string {
  let body = "";
  const rnd = new Uint32Array(4);
  (globalThis.crypto ?? window.crypto).getRandomValues(rnd);
  for (let i = 0; i < 4; i++) body += ALPHABET[rnd[i] % ALPHABET.length];
  return `SER-${body}`;
}

/** Normaliza un código escrito por el usuario (mayúsculas, con guion). */
export function normalizeCode(input: string): string {
  const clean = input.trim().toUpperCase().replace(/\s+/g, "").replace(/^SER-?/, "");
  const body = clean.replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return body ? `SER-${body}` : "";
}

/**
 * Publica un recurso y devuelve el código corto. Reintenta si el código
 * ya existía (colisión), hasta 5 veces.
 */
export async function publishShare(
  resource: Omit<SharedResource, "code" | "createdAt">
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    const ref = doc(db, "shares", code);
    const existing = await getDoc(ref);
    if (existing.exists()) continue; // colisión: reintenta
    await setDoc(ref, {
      code,
      type: resource.type,
      title: resource.title.slice(0, 120),
      data: resource.data,
      owner: resource.owner ?? null,
      createdAt: serverTimestamp(),
    });
    return code;
  }
  return null;
}

/** Trae un recurso por su código corto. Devuelve null si no existe. */
export async function fetchShare(codeInput: string): Promise<SharedResource | null> {
  const db = getDb();
  if (!db) return null;
  const code = normalizeCode(codeInput);
  if (!code) return null;
  try {
    const snap = await getDoc(doc(db, "shares", code));
    if (!snap.exists()) return null;
    return snap.data() as SharedResource;
  } catch {
    return null;
  }
}
