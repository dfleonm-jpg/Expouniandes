import { generateJSON } from "@/lib/ai";
import { quizPrompt, QUIZ_SHAPE } from "@/lib/prompts";
import { json, handleApiError } from "@/lib/api-helpers";
import type { QuizQuestion } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { topic, count, difficulty, locale } = (await req.json()) as {
      topic: string;
      count: number;
      difficulty: string;
      locale?: string;
    };

    if (!topic?.trim()) return json({ error: "Falta el tema" }, 400);

    const n = Math.min(Math.max(Number(count) || 5, 3), 12);
    const data = await generateJSON<{ questions: QuizQuestion[] }>(
      quizPrompt(topic, n, difficulty, locale),
      QUIZ_SHAPE
    );

    if (!data.questions?.length) return json({ error: "No se pudieron generar preguntas." }, 502);
    return json(data);
  } catch (err) {
    return handleApiError(err, "Quiz");
  }
}
