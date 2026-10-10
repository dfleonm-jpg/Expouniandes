// Codifica/decodifica contenido para compartir entre estudiantes mediante un
// código de texto (sin servidor). Usa base64 con prefijo identificador.

export type ShareType = "quiz" | "flashcards" | "summary";
export type SharePayload = { type: ShareType; title: string; data: unknown };

const PREFIX = "SERENO1:";

export function encodeShare(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  const b64 = toBase64(json);
  // Agrupa en bloques de 4 para que sea más legible al copiar.
  return PREFIX + b64;
}

export function decodeShare(code: string): SharePayload | null {
  try {
    const trimmed = code.trim().replace(/\s+/g, "");
    if (!trimmed.startsWith(PREFIX)) return null;
    const b64 = trimmed.slice(PREFIX.length);
    const json = fromBase64(b64);
    const payload = JSON.parse(json) as SharePayload;
    if (!payload.type || !payload.data) return null;
    return payload;
  } catch {
    return null;
  }
}

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fromBase64(b64: string): string {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
