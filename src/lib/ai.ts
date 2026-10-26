// ============================================================
// Capa de IA agnóstica al proveedor (Groq / Google Gemini).
//
// - Elige el proveedor según las claves disponibles.
// - FAILOVER REAL: si el proveedor primario falla con un error
//   recuperable (rate limit, 5xx, sin cuota), reintenta con el
//   secundario automáticamente.
// - Streaming: propaga los errores al cliente en lugar de cerrar
//   el stream en silencio (evita respuestas truncadas "exitosas").
//
// Claves gratis:
//   - Groq:   https://console.groq.com/keys
//   - Gemini: https://aistudio.google.com/apikey
// ============================================================

import { GoogleGenAI } from "@google/genai";
import { STREAM_ERROR_MARKER } from "./stream-protocol";

export { STREAM_ERROR_MARKER };

export type Provider = "groq" | "gemini";

export const LANGUAGE_NAMES: Record<string, string> = {
  es: "español",
  en: "English",
  pt: "português",
  fr: "français",
};

const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Error con mensaje legible para el usuario final. */
export class AIError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly status: number = 500,
    /** Si el error es transitorio y tiene sentido probar con otro proveedor. */
    public readonly recoverable: boolean = false
  ) {
    super(message);
    this.name = "AIError";
  }
}

export type ChatRole = "user" | "model";
export type ChatMessage = { role: ChatRole; text: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const hasGroq = () => Boolean(process.env.GROQ_API_KEY);
const hasGemini = () => Boolean(process.env.GEMINI_API_KEY);

/** Proveedor primario según las claves presentes (prioridad Groq → Gemini). */
export function getProvider(): Provider {
  if (hasGroq()) return "groq";
  if (hasGemini()) return "gemini";
  throw new AIError(
    "No AI key configured",
    "La IA no está configurada en el servidor. Añade la variable GROQ_API_KEY en Vercel → Settings → Environment Variables y vuelve a desplegar.",
    503
  );
}

/**
 * Lista de proveedores a intentar en orden: el primario y, si existe
 * y es distinto, el secundario como respaldo.
 */
function providerChain(): Provider[] {
  const chain: Provider[] = [];
  if (hasGroq()) chain.push("groq");
  if (hasGemini()) chain.push("gemini");
  if (chain.length === 0) getProvider(); // lanza el error 503 estándar
  return chain;
}

/**
 * Ejecuta `fn` con el primer proveedor; si falla con un error recuperable
 * y hay un segundo proveedor, lo reintenta con él. Devuelve el resultado
 * del primero que tenga éxito o lanza el último error.
 */
async function withFailover<T>(fn: (provider: Provider) => Promise<T>): Promise<T> {
  const chain = providerChain();
  let lastErr: unknown;
  for (let i = 0; i < chain.length; i++) {
    try {
      return await fn(chain[i]);
    } catch (err) {
      lastErr = err;
      const recoverable = err instanceof AIError ? err.recoverable : true;
      const hasNext = i < chain.length - 1;
      if (recoverable && hasNext) {
        console.warn(`[ai] proveedor ${chain[i]} falló (${err instanceof Error ? err.message : err}); probando respaldo...`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/**
 * Llama a la API de Groq con reintentos automáticos ante 429 o 5xx.
 * Respeta el header `retry-after`.
 */
async function groqFetch(body: unknown, retries = 2): Promise<Response> {
  let lastRes: Response | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return res;
    lastRes = res;
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt < retries) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : 1200 * (attempt + 1);
      await sleep(Math.min(waitMs, 6000));
    }
  }
  return lastRes!;
}

/** Convierte un fallo HTTP de Groq en AIError, marcando si es recuperable. */
async function groqError(res: Response): Promise<AIError> {
  const errText = await res.text().catch(() => "");
  const recoverable = res.status === 429 || res.status === 402 || res.status >= 500 || /credit|billing|quota/i.test(errText);
  return new AIError(`Groq ${res.status}: ${errText}`, humanizeError(res.status, errText), res.status, recoverable);
}

function geminiError(err: unknown): AIError {
  const msg = err instanceof Error ? err.message : String(err);
  // Los SDK de Gemini suelen incluir el código en el mensaje.
  const status = /429|rate/i.test(msg) ? 429 : /quota|resource.exhausted/i.test(msg) ? 402 : /401|403|permission|api key/i.test(msg) ? 401 : 500;
  const recoverable = status === 429 || status === 402 || status >= 500;
  return new AIError(`Gemini: ${msg}`, humanizeError(status, msg), status, recoverable);
}

// ---------------------------------------------------------------
// CHAT EN STREAMING (con failover y propagación de errores)
// ---------------------------------------------------------------
export async function streamChat(
  messages: ChatMessage[],
  system: string
): Promise<ReadableStream<Uint8Array>> {
  // El failover ocurre ANTES de empezar a emitir: elegimos un proveedor
  // cuya conexión inicial funcione. Un corte a mitad de stream ya no se
  // puede recuperar, pero sí se le avisa al cliente con el marcador.
  return withFailover((provider) =>
    provider === "groq" ? streamGroq(messages, system) : streamGemini(messages, system)
  );
}

async function streamGroq(messages: ChatMessage[], system: string): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const res = await groqFetch({
    model: GROQ_MODEL,
    stream: true,
    temperature: 0.7,
    max_tokens: 4096,
    messages: [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.text })),
    ],
  });

  if (!res.ok || !res.body) throw await groqError(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              /* fragmento incompleto; se completa en la siguiente iteración */
            }
          }
        }
      } catch (err) {
        console.error("Groq stream error:", err);
        controller.enqueue(encoder.encode(STREAM_ERROR_MARKER));
      } finally {
        controller.close();
      }
    },
  });
}

async function streamGemini(messages: ChatMessage[], system: string): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  let stream: AsyncIterable<{ text?: string }>;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    stream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      config: { systemInstruction: system, maxOutputTokens: 4096 },
    });
  } catch (err) {
    throw geminiError(err);
  }

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
        }
      } catch (err) {
        console.error("Gemini stream error:", err);
        controller.enqueue(encoder.encode(STREAM_ERROR_MARKER));
      } finally {
        controller.close();
      }
    },
  });
}

// ---------------------------------------------------------------
// GENERACIÓN DE JSON (con failover)
// ---------------------------------------------------------------
export async function generateJSON<T>(prompt: string, shapeHint: string): Promise<T> {
  const system = `Eres un asistente que responde EXCLUSIVAMENTE con JSON válido, sin texto adicional, sin markdown, sin bloques de código. La forma del JSON debe ser exactamente: ${shapeHint}`;

  return withFailover(async (provider) => {
    if (provider === "groq") {
      const res = await groqFetch({
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      });
      if (!res.ok) throw await groqError(res);
      const data = await res.json();
      return safeParse<T>(data.choices?.[0]?.message?.content ?? "{}");
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { systemInstruction: system, responseMimeType: "application/json" },
      });
      return safeParse<T>(response.text ?? "{}");
    } catch (err) {
      if (err instanceof AIError) throw err; // safeParse ya es legible
      throw geminiError(err);
    }
  });
}

// ---------------------------------------------------------------
// GENERACIÓN DE JSON CON IMAGEN (visión) — para retroalimentar dibujos.
//
// Gemini "ve" la imagen de verdad; Groq (gpt-oss) es solo texto, así que
// si toca el respaldo de Groq se usa únicamente la descripción textual
// que acompaña a la imagen (el prompt ya lo contempla).
// ---------------------------------------------------------------
export async function generateJSONWithImage<T>(
  prompt: string,
  shapeHint: string,
  image: { dataUrl: string }
): Promise<T> {
  const system = `Eres un asistente que responde EXCLUSIVAMENTE con JSON válido, sin texto adicional, sin markdown, sin bloques de código. La forma del JSON debe ser exactamente: ${shapeHint}`;

  // Separa el data URL en mimeType + base64 (sin flag "s" para compatibilidad de target).
  const url = image.dataUrl.trim();
  const comma = url.indexOf(",");
  const header = comma >= 0 ? url.slice(0, comma) : "";
  const base64 = comma >= 0 ? url.slice(comma + 1) : "";
  const mimeMatch = /^data:([^;]+)/.exec(header);
  const mimeType = mimeMatch?.[1] || "image/png";

  // Prioriza Gemini (tiene visión); si no hay Gemini, intenta Groq solo-texto.
  const chain: Provider[] = [];
  if (hasGemini()) chain.push("gemini");
  if (hasGroq()) chain.push("groq");
  if (chain.length === 0) getProvider();

  let lastErr: unknown;
  for (let i = 0; i < chain.length; i++) {
    const provider = chain[i];
    try {
      if (provider === "gemini") {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                ...(base64 ? [{ inlineData: { mimeType, data: base64 } }] : []),
              ],
            },
          ],
          config: { systemInstruction: system, responseMimeType: "application/json" },
        });
        return safeParse<T>(response.text ?? "{}");
      }
      // Groq: sin visión. Solo texto (el prompt incluye la descripción del dibujo).
      const res = await groqFetch({
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      });
      if (!res.ok) throw await groqError(res);
      const data = await res.json();
      return safeParse<T>(data.choices?.[0]?.message?.content ?? "{}");
    } catch (err) {
      lastErr = err;
      const recoverable = err instanceof AIError ? err.recoverable : true;
      if (recoverable && i < chain.length - 1) {
        console.warn(`[ai:image] proveedor ${provider} falló; probando respaldo...`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------
// GENERACIÓN DE TEXTO SIMPLE (con failover)
// ---------------------------------------------------------------
export async function generateText(prompt: string, system: string): Promise<string> {
  return withFailover(async (provider) => {
    if (provider === "groq") {
      const res = await groqFetch({
        model: GROQ_MODEL,
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      });
      if (!res.ok) throw await groqError(res);
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { systemInstruction: system },
      });
      return response.text ?? "";
    } catch (err) {
      throw geminiError(err);
    }
  });
}

// ---------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------
function safeParse<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/[{[][\s\S]*[}\]]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        /* ignore */
      }
    }
    throw new AIError(
      "Invalid JSON from model",
      "La IA devolvió una respuesta con formato inesperado. Intenta de nuevo.",
      502
    );
  }
}

function humanizeError(status: number, body: string): string {
  if (status === 401 || status === 403)
    return "La clave de IA no es válida o expiró. Revisa GROQ_API_KEY en Vercel.";
  if (status === 429)
    return "Se alcanzó el límite de peticiones de la IA. Espera un momento e intenta de nuevo.";
  if (status === 402 || /credit|billing|quota/i.test(body))
    return "La cuenta de IA se quedó sin créditos/cuota. Usa otra clave o espera a que se renueve.";
  if (status >= 500)
    return "El servicio de IA tuvo un problema temporal. Intenta de nuevo en unos segundos.";
  return "No se pudo contactar la IA. Intenta de nuevo.";
}
