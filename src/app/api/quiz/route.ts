import { generateQuiz, LANGUAGE_NAMES } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { topic, count, difficulty, locale } = (await req.json()) as {
      topic: string;
      count: number;
      difficulty: string;
      locale?: string;
    };

    if (!topic || !topic.trim()) {
      return new Response(JSON.stringify({ error: "Falta el tema" }), { status: 400 });
    }

    const lang = LANGUAGE_NAMES[locale ?? "es"] ?? "español";
    const n = Math.min(Math.max(Number(count) || 5, 3), 10);

    const prompt = `Genera un quiz de opción múltiple sobre: "${topic}".
Idioma: ${lang}.
Cantidad de preguntas: ${n}.
Dificultad: ${difficulty}.
Cada pregunta debe tener exactamente 4 opciones, una sola correcta (correctIndex es el índice 0-3 de la opción correcta), y una explicación breve de por qué es correcta.
Escribe TODO (preguntas, opciones y explicaciones) en ${lang}.`;

    const data = await generateQuiz(prompt);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Quiz error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
