import { generateJSON } from "@/lib/ai";
import { openExamPrompt, OPEN_EXAM_SHAPE, type ProfileInput } from "@/lib/prompts";
import { json, readJson, requireText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { OpenExam } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "open-exam" });

    const { subject, count, difficulty, locale, profile } = await readJson<{
      subject?: string;
      count?: number;
      difficulty?: string;
      locale?: string;
      profile?: ProfileInput;
    }>(req);

    const theSubject = requireText(subject, "Elige una materia o tema.", { max: 120 });
    const n = Math.min(Math.max(Number(count) || 4, 2), 8);
    const diff = difficulty === "facil" || difficulty === "media" || difficulty === "dificil" ? difficulty : "media";

    const data = await generateJSON<OpenExam>(openExamPrompt(theSubject, n, diff, locale, profile), OPEN_EXAM_SHAPE);
    if (!Array.isArray(data.questions) || !data.questions.length)
      return json({ error: "No se pudo generar el parcial." }, 502, rl);
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "OpenExam", rl);
  }
}
