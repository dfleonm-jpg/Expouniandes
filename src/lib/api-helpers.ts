import { AIError } from "./ai";
import { rateLimit, type RateLimitOptions } from "./rate-limit";

// ------------------------------------------------------------
// Respuestas JSON y manejo de errores
// ------------------------------------------------------------
export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function handleApiError(err: unknown, label: string) {
  console.error(`${label} error:`, err);
  if (err instanceof ApiError) return json({ error: err.userMessage }, err.status);
  if (err instanceof AIError) return json({ error: err.userMessage }, err.status);
  const message = err instanceof Error ? err.message : "Error desconocido";
  return json({ error: `Algo salió mal: ${message}` }, 500);
}

/** Error de validación/entrada con mensaje legible para el usuario. */
export class ApiError extends Error {
  constructor(public readonly userMessage: string, public readonly status = 400) {
    super(userMessage);
    this.name = "ApiError";
  }
}

// ------------------------------------------------------------
// Respuesta de streaming (texto plano, sin caché)
// ------------------------------------------------------------
export function streamResponse(stream: ReadableStream<Uint8Array>, headers: Record<string, string> = {}) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      ...headers,
    },
  });
}

// ------------------------------------------------------------
// Identificación del cliente (para rate limiting)
// ------------------------------------------------------------
/** Mejor estimación de la IP del cliente a partir de las cabeceras de proxy. */
export function getClientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") || h.get("cf-connecting-ip") || "anon";
}

// ------------------------------------------------------------
// Rate limiting como guard reutilizable
// ------------------------------------------------------------
/**
 * Aplica rate limiting a la petición. Si se excede el límite, lanza un
 * `ApiError` 429 (lo captura `handleApiError`). Devuelve las cabeceras
 * `X-RateLimit-*` para adjuntarlas a la respuesta cuando todo va bien.
 */
export function enforceRateLimit(req: Request, opts: RateLimitOptions): Record<string, string> {
  const ip = getClientIp(req);
  const r = rateLimit(ip, opts);
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(Math.ceil(r.resetAt / 1000)),
  };
  if (!r.ok) {
    throw new RateLimitError(
      "Vas muy rápido. Espera unos segundos antes de volver a intentarlo.",
      r.retryAfter
    );
  }
  return headers;
}

/** Error 429 con `Retry-After`. */
export class RateLimitError extends ApiError {
  constructor(userMessage: string, public readonly retryAfter: number) {
    super(userMessage, 429);
    this.name = "RateLimitError";
  }
}

// Extiende el manejador de errores para respetar `Retry-After`.
const baseHandle = handleApiError;
export function handleApiErrorWithHeaders(err: unknown, label: string, headers: Record<string, string> = {}) {
  if (err instanceof RateLimitError) {
    console.error(`${label} rate-limited`);
    return json({ error: err.userMessage }, 429, { ...headers, "Retry-After": String(err.retryAfter) });
  }
  const res = baseHandle(err, label);
  // Reinyecta cabeceras informativas si las había.
  if (Object.keys(headers).length) {
    const merged = new Headers(res.headers);
    for (const [k, v] of Object.entries(headers)) merged.set(k, v);
    return new Response(res.body, { status: res.status, headers: merged });
  }
  return res;
}

// ------------------------------------------------------------
// Lectura de JSON con tope de tamaño (evita payloads gigantes)
// ------------------------------------------------------------
const DEFAULT_MAX_BODY = 200_000; // ~200 KB de JSON por petición

/**
 * Lee y parsea el body JSON validando el tamaño. Lanza `ApiError` 413
 * si el body supera `maxBytes`, o 400 si no es JSON válido.
 */
export async function readJson<T = Record<string, unknown>>(
  req: Request,
  maxBytes = DEFAULT_MAX_BODY
): Promise<T> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len && len > maxBytes) {
    throw new ApiError("El contenido es demasiado grande. Reduce el tamaño del texto.", 413);
  }
  const raw = await req.text();
  if (raw.length > maxBytes) {
    throw new ApiError("El contenido es demasiado grande. Reduce el tamaño del texto.", 413);
  }
  try {
    return JSON.parse(raw || "{}") as T;
  } catch {
    throw new ApiError("La petición no es válida.", 400);
  }
}

// ------------------------------------------------------------
// Utilidades de saneado de entrada
// ------------------------------------------------------------
/** Recorta y acota un string de texto libre. */
export function clampText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

/** Valida/acota un historial de mensajes de chat. */
export function sanitizeMessages(
  value: unknown,
  { maxMessages = 40, maxChars = 8000 }: { maxMessages?: number; maxChars?: number } = {}
): { role: "user" | "model"; text: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m) => m && typeof m === "object" && typeof (m as { text?: unknown }).text === "string")
    .slice(-maxMessages)
    .map((m) => {
      const msg = m as { role?: unknown; text: string };
      return {
        role: msg.role === "model" ? ("model" as const) : ("user" as const),
        text: msg.text.slice(0, maxChars),
      };
    });
}

/** Requiere que un string tenga contenido; lanza `ApiError` si no. */
export function requireText(value: unknown, message: string, { min = 1, max = 20000 } = {}): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (s.length < min) throw new ApiError(message, 400);
  return s.slice(0, max);
}
