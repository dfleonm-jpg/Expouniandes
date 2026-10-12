import { generateJSON } from "@/lib/ai";
import { quizPrompt, QUIZ_SHAPE, type ProfileInput } from "@/lib/prompts";
import { json, readJson, requireText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { QuizQuestion } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "quiz" });

    const { topic, count, difficulty, locale, profile } = await readJson<{
      topic?: string;
      count?: number;
      difficulty?: string;
      locale?: string;
      profile?: ProfileInput;
    }>(req);

    const theTopic = requireText(topic, "Falta el tema", { max: 500 });
    const n = Math.min(Math.max(Number(count) || 5, 3), 12);
    const data = await generateJSON<{ questions: QuizQuestion[] }>(
      quizPrompt(theTopic, n, difficulty ?? "media", locale, profile),
      QUIZ_SHAPE
    );

    if (!Array.isArray(data.questions) || !data.questions.length)
      return json({ error: "No se pudieron generar preguntas." }, 502, rl);
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "Quiz", rl);
  }
}
