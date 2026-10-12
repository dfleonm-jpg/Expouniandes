import { generateJSON } from "@/lib/ai";
import { studyPlanPrompt, STUDY_PLAN_SHAPE, type ProfileInput } from "@/lib/prompts";
import { json, readJson, requireText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { StudyPlan } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "study-plan" });

    const { input, locale, profile } = await readJson<{ input?: string; locale?: string; profile?: ProfileInput }>(req);
    const theInput = requireText(input, "Describe qué necesitas estudiar.", { max: 2000 });

    const data = await generateJSON<StudyPlan>(studyPlanPrompt(theInput, locale, profile), STUDY_PLAN_SHAPE);
    if (!Array.isArray(data.days) || !data.days.length)
      return json({ error: "No se pudo generar el plan." }, 502, rl);
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "StudyPlan", rl);
  }
}
