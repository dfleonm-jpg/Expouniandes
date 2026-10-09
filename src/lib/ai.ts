// ============================================================
// Capa de IA agnóstica al proveedor (Groq / Google Gemini).
// Elige automáticamente según la clave disponible en el entorno.
// Prioridad: GROQ_API_KEY -> GEMINI_API_KEY
//
// Claves gratis:
//   - Groq:   https://console.groq.com/keys
//   - Gemini: https://aistudio.google.com/apikey
// ============================================================

import { GoogleGenAI } from "@google/genai";

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
    public readonly status: number = 500
  ) {
    super(message);
    this.name = "AIError";
  }
}

export function getProvider(): Provider {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  throw new AIError(
    "No AI key configured",
    "La IA no está configurada en el servidor. Añade la variable GROQ_API_KEY en Vercel → Settings → Environment Variables y vuelve a desplegar.",
    503
  );
}

export type ChatRole = "user" | "model";
export type ChatMessage = { role: ChatRole; text: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Llama a la API de Groq con reintentos automáticos si llega un 429
 * (límite de peticiones del plan gratuito) o un error 5xx temporal.
 * Respeta el header `retry-after` cuando viene.
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
    // Solo reintenta en 429 (rate limit) o 5xx.
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt < retries) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : 1200 * (attempt + 1);
      await sleep(Math.min(waitMs, 6000));
    }
  }
  return lastRes!;
}

// ---------------------------------------------------------------
// CHAT EN STREAMING
// ---------------------------------------------------------------
export async function streamChat(
  messages: ChatMessage[],
  system: string
): Promise<ReadableStream<Uint8Array>> {
  const provider = getProvider();
  const encoder = new TextEncoder();

  if (provider === "groq") {
    const res = await groqFetch({
      model: GROQ_MODEL,
      stream: true,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({
          role: m.role === "model" ? "assistant" : "user",
          content: m.text,
        })),
      ],
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => "");
      throw new AIError(
        `Groq ${res.status}: ${errText}`,
        humanizeError(res.status, errText),
        res.status
      );
    }

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
                const json = JSON.parse(data);
                const token = json.choices?.[0]?.delta?.content;
                if (token) controller.enqueue(encoder.encode(token));
              } catch {
                /* fragmento incompleto, se completa en la siguiente iteración */
              }
            }
          }
        } catch (err) {
          console.error("Groq stream error:", err);
        } finally {
          controller.close();
        }
      },
    });
  }

  // Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL,
    contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    config: { systemInstruction: system },
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
        }
      } catch (err) {
        console.error("Gemini stream error:", err);
      } finally {
        controller.close();
      }
    },
  });
}

// ---------------------------------------------------------------
// GENERACIÓN DE JSON (helper genérico reutilizable)
// ---------------------------------------------------------------
/**
 * Pide al modelo una respuesta en JSON y la parsea.
 * `shapeHint` describe la estructura esperada (se inyecta en el system prompt).
 */
export async function generateJSON<T>(prompt: string, shapeHint: string): Promise<T> {
  const provider = getProvider();
  const system = `Eres un asistente que responde EXCLUSIVAMENTE con JSON válido, sin texto adicional, sin markdown, sin bloques de código. La forma del JSON debe ser exactamente: ${shapeHint}`;

  if (provider === "groq") {
    const res = await groqFetch({
      model: GROQ_MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new AIError(
        `Groq ${res.status}: ${errText}`,
        humanizeError(res.status, errText),
        res.status
      );
    }
    const data = await res.json();
    return safeParse<T>(data.choices?.[0]?.message?.content ?? "{}");
  }

  // Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
    },
  });
  return safeParse<T>(response.text ?? "{}");
}

// ---------------------------------------------------------------
// GENERACIÓN DE TEXTO SIMPLE (no streaming)
// ---------------------------------------------------------------
export async function generateText(prompt: string, system: string): Promise<string> {
  const provider = getProvider();

  if (provider === "groq") {
    const res = await groqFetch({
      model: GROQ_MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new AIError(`Groq ${res.status}`, humanizeError(res.status, errText), res.status);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { systemInstruction: system },
  });
  return response.text ?? "";
}

// ---------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------
function safeParse<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Intenta extraer el primer objeto/array JSON del texto.
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
