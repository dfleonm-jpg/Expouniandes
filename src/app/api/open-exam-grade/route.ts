import { generateJSON } from "@/lib/ai";
import { openExamGradePrompt, OPEN_EXAM_GRADE_SHAPE } from "@/lib/prompts";
import { json, readJson, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { OpenExamResult } from "@/lib/types";

export const maxDuration = 60;

type GradeItem = {
  id: string;
  topic: string;
  prompt: string;
  expectedAnswer: string;
  rubric: string;
  points: number;
  answer: string;
};

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "open-exam-grade" });

    const { items, locale } = await readJson<{ items?: unknown; locale?: string }>(req);

    const safe: GradeItem[] = Array.isArray(items)
      ? items
          .filter((x) => x && typeof x === "object")
          .slice(0, 8)
          .map((x) => {
            const o = x as Record<string, unknown>;
            // Payload acotado: la calificación es la petición más pesada de la
            // app; mantenerla ligera evita cortes por timeout del proveedor.
            return {
              id: typeof o.id === "string" ? o.id.slice(0, 40) : "",
              topic: typeof o.topic === "string" ? o.topic.slice(0, 80) : "—",
              prompt: typeof o.prompt === "string" ? o.prompt.slice(0, 1200) : "",
              expectedAnswer: typeof o.expectedAnswer === "string" ? o.expectedAnswer.slice(0, 1500) : "",
              rubric: typeof o.rubric === "string" ? o.rubric.slice(0, 800) : "",
              points: Number(o.points) || 0,
              answer: typeof o.answer === "string" ? o.answer.slice(0, 2500) : "",
            };
          })
      : [];

    if (safe.length === 0) return json({ error: "No hay respuestas para calificar." }, 400, rl);

    const data = await generateJSON<OpenExamResult>(openExamGradePrompt(safe, locale), OPEN_EXAM_GRADE_SHAPE);
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "OpenExamGrade", rl);
  }
}
