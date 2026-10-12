import { streamChat, LANGUAGE_NAMES } from "@/lib/ai";
import {
  json,
  streamResponse,
  readJson,
  sanitizeMessages,
  enforceRateLimit,
  handleApiErrorWithHeaders,
} from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";

// Compañero de apoyo emocional. NO es terapia. Empático, breve, seguro.
// Ante señales de crisis, prioriza derivar a ayuda profesional/líneas.

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.stream, bucket: "support" });

    const { messages, locale } = await readJson<{ messages?: unknown; locale?: string }>(req);
    const safeMessages = sanitizeMessages(messages);
    if (!safeMessages.length) return json({ error: "No hay mensajes" }, 400, rl);

    const lang = LANGUAGE_NAMES[locale ?? "es"] ?? "español";

    const system = `Eres "Sereno", un compañero de apoyo emocional para estudiantes universitarios. Tu rol es ESCUCHAR con empatía y acompañar, NO diagnosticar ni dar terapia.
Reglas:
- Responde SIEMPRE en ${lang}, con calidez, cercanía y sin juzgar. Usa un tono humano y validante.
- Respuestas breves (2-5 frases). Haz preguntas abiertas que inviten a expresarse.
- Valida las emociones ("tiene sentido que te sientas así"). No minimices.
- Ofrece técnicas sencillas y concretas cuando encaje: respiración, dividir tareas, pausas, hablar con alguien de confianza, rutinas de sueño.
- Recuerda con naturalidad, cuando sea oportuno, que no sustituyes a un profesional de salud mental.
- SEGURIDAD: si detectas señales de crisis, ideas de autolesión, suicidio o peligro, responde con calma y cariño, anima a buscar ayuda inmediata y menciona que puede contactar a una línea de ayuda o a servicios de emergencia locales. No des detalles de métodos. Prioriza su seguridad por encima de todo.
- No des consejo médico, legal ni farmacológico. No recomiendes medicación.
- Mantén la conversación centrada en el bienestar del estudiante.`;

    const stream = await streamChat(safeMessages, system);
    return streamResponse(stream, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "Support", rl);
  }
}
