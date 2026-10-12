// ============================================================
// Rate limiting en memoria (ventana deslizante por IP + ruta).
//
// Protege los endpoints de IA del abuso y del gasto descontrolado
// de la cuota de Groq/Gemini. Es un limitador *best-effort* en el
// proceso del servidor: en Vercel cada instancia serverless tiene su
// propio mapa, así que no es un límite global exacto, pero sí frena
// de forma efectiva los bucles de peticiones de un mismo cliente.
//
// Para un límite global y persistente se podría cambiar la
// implementación por Upstash Redis sin tocar los llamadores.
// ============================================================

type Hit = { count: number; resetAt: number };

// Mapa: clave (ip|bucket) -> ventana actual.
const store = new Map<string, Hit>();

// Limpieza periódica para no acumular claves viejas en memoria.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, hit] of store) {
    if (hit.resetAt <= now) store.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // epoch ms
  retryAfter: number; // segundos
};

export type RateLimitOptions = {
  /** Nº máximo de peticiones permitidas por ventana. */
  limit: number;
  /** Tamaño de la ventana en milisegundos. */
  windowMs: number;
  /** Separa los contadores por tipo de recurso (p. ej. "chat", "quiz"). */
  bucket?: string;
};

/**
 * Registra un acceso y devuelve si está dentro del límite.
 * No lanza; el llamador decide qué hacer con `ok === false`.
 */
export function rateLimit(id: string, opts: RateLimitOptions): RateLimitResult {
  const { limit, windowMs, bucket = "default" } = opts;
  const now = Date.now();
  sweep(now);

  const key = `${bucket}|${id}`;
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, limit, remaining: limit - 1, resetAt, retryAfter: 0 };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const ok = existing.count <= limit;
  return {
    ok,
    limit,
    remaining,
    resetAt: existing.resetAt,
    retryAfter: ok ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

// Perfiles de límite por tipo de endpoint. Las rutas de IA son más
// caras (tokens), así que son más estrictas que las de utilidad.
export const RATE_PROFILES = {
  // Chat/streaming: conversacional, algo más permisivo.
  stream: { limit: 30, windowMs: 60_000 },
  // Generación JSON/texto (quiz, resumen, flashcards, etc.): cara.
  ai: { limit: 20, windowMs: 60_000 },
  // Utilidades baratas sin IA (búsqueda web).
  util: { limit: 40, windowMs: 60_000 },
} as const;
