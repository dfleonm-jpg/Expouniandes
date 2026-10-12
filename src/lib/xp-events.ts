"use client";

// Bus de eventos mínimo para avisar de ganancias de XP y subidas de nivel.
// Permite que el AppContext (que calcula el XP) notifique a un componente
// dentro del ToastProvider sin acoplar los providers entre sí.

export type XpEvent = { gained: number; total: number; leveledUp: boolean; level: number };

type Listener = (e: XpEvent) => void;
const listeners = new Set<Listener>();

export function onXp(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitXp(e: XpEvent) {
  for (const l of listeners) {
    try {
      l(e);
    } catch {
      /* ignore */
    }
  }
}
