import { streamChat, type ChatMessage } from "@/lib/ai";
import { LANGUAGE_NAMES } from "@/lib/ai";
import { handleApiError, json } from "@/lib/api-helpers";

// Compañero de apoyo emocional. NO es terapia. Empático, breve, seguro.
// Ante señales de crisis, prioriza derivar a ayuda profesional/líneas.

export async function POST(req: Request) {
  try {
    const { messages, locale } = (await req.json()) as { messages: ChatMessage[]; locale?: string };
    if (!messages?.length) return json({ error: "No hay mensajes" }, 400);

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

    const stream = await streamChat(messages, system);
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    return handleApiError(err, "Support");
  }
}
