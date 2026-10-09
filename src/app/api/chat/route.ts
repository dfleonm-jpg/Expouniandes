import { streamChat, LANGUAGE_NAMES, type ChatMessage } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { messages, locale } = (await req.json()) as {
      messages: ChatMessage[];
      locale?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No hay mensajes" }), { status: 400 });
    }

    const lang = LANGUAGE_NAMES[locale ?? "es"] ?? "español";

    const system = `Eres Sereno, un tutor académico con IA, empático y motivador, creado para ayudar a estudiantes universitarios a estudiar y a reducir su estrés académico.
Reglas:
- Responde SIEMPRE en ${lang}.
- Explica de forma clara, estructurada y con ejemplos. Usa listas y pasos cuando ayude.
- Sé cálido y alentador; reconoce el esfuerzo del estudiante.
- Si detectas estrés o ansiedad, ofrece una técnica breve (respiración, descansos, dividir tareas) además de responder.
- Si te piden un plan de estudio, estructúralo por días/sesiones con tiempos realistas.
- No inventes datos; si no sabes algo, dilo con honestidad.
- Sé conciso pero completo. Usa formato markdown.`;

    const readable = await streamChat(messages, system);

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
