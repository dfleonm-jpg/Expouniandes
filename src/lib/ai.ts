// Capa de IA agnóstica al proveedor.
// Soporta Groq (OpenAI-compatible) y Google Gemini.
// Elige automáticamente según qué clave esté configurada en el entorno.
//
// Prioridad: GROQ_API_KEY  ->  GEMINI_API_KEY
//
// Consigue las claves gratis en:
//   - Groq:   https://console.groq.com/keys
//   - Gemini: https://aistudio.google.com/apikey

import { GoogleGenAI, Type } from "@google/genai";

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

export function getProvider(): Provider {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  throw new Error(
    "No hay ninguna clave de IA configurada. Añade GROQ_API_KEY o GEMINI_API_KEY en tu archivo .env.local"
  );
}

export type ChatMessage = { role: "user" | "model"; text: string };

/**
 * Genera una respuesta de chat en streaming (ReadableStream de texto plano).
 */
export async function streamChat(
  messages: ChatMessage[],
  system: string
): Promise<ReadableStream<Uint8Array>> {
  const provider = getProvider();
  const encoder = new TextEncoder();

  if (provider === "groq") {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        stream: true,
        messages: [
          { role: "system", content: system },
          ...messages.map((m) => ({
            role: m.role === "model" ? "assistant" : "user",
            content: m.text,
          })),
        ],
      }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Groq error ${res.status}: ${errText}`);
    }

    // Convierte el stream SSE de Groq a texto plano.
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
                /* ignora fragmentos incompletos */
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

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

/**
 * Genera un quiz estructurado (JSON) con cualquiera de los proveedores.
 */
export async function generateQuiz(prompt: string): Promise<{ questions: QuizQuestion[] }> {
  const provider = getProvider();

  if (provider === "groq") {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Responde SOLO con JSON válido con esta forma: {"questions":[{"question":string,"options":[string,string,string,string],"correctIndex":number,"explanation":string}]}',
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Groq error ${res.status}: ${errText}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(content);
  }

  // Gemini (salida estructurada con schema)
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ["question", "options", "correctIndex", "explanation"],
            },
          },
        },
        required: ["questions"],
      },
    },
  });
  return JSON.parse(response.text ?? "{}");
}
