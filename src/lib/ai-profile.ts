"use client";

import type { ProfileInput } from "./prompts";

// Pequeño "holder" a nivel de módulo con el perfil del estudiante activo.
// Lo mantiene actualizado el AppProvider y lo consumen los hooks de red
// (useAIRequest / useChatStream) para adjuntar automáticamente el perfil a
// las peticiones de IA, sin tener que pasarlo manualmente en cada sección.

let activeProfile: ProfileInput | undefined;

export function setActiveProfile(p: ProfileInput | undefined) {
  activeProfile = p;
}

export function getActiveProfile(): ProfileInput | undefined {
  return activeProfile;
}

/**
 * Fusiona el perfil activo dentro del body de una petición de IA, SIN
 * sobrescribir un `profile` que el llamador ya haya puesto explícitamente.
 */
export function withProfile(body: unknown): unknown {
  if (!activeProfile) return body;
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const b = body as Record<string, unknown>;
    if ("profile" in b && b.profile) return body; // respeta el explícito
    return { ...b, profile: activeProfile };
  }
  return body;
}
