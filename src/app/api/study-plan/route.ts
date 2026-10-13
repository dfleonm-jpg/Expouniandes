import { generateJSON } from "@/lib/ai";
import { studyPlanPrompt, STUDY_PLAN_SHAPE, type ProfileInput, type StudyPlanOptions } from "@/lib/prompts";
import { json, readJson, requireText, clampText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { StudyPlan } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "study-plan" });

    const { input, locale, profile, options } = await readJson<{
      input?: string;
      locale?: string;
      profile?: ProfileInput;
      options?: Record<string, unknown>;
    }>(req);
    const theInput = requireText(input, "Describe qué necesitas estudiar.", { max: 2000 });

    // Sanea las opciones del plan especializado.
    const o = options ?? {};
    const intensity = o.intensity === "ligero" || o.intensity === "equilibrado" || o.intensity === "intensivo" ? o.intensity : undefined;
    const safeOptions: StudyPlanOptions = {
      subject: clampText(o.subject, 80) || undefined,
      examDate: typeof o.examDate === "string" ? o.examDate.slice(0, 10) : undefined,
      daysUntil: typeof o.daysUntil === "number" && o.daysUntil >= 0 ? Math.min(o.daysUntil, 180) : undefined,
      hoursPerDay: typeof o.hoursPerDay === "number" && o.hoursPerDay > 0 ? Math.min(o.hoursPerDay, 12) : undefined,
      intensity,
      weakAreas: Array.isArray(o.weakAreas)
        ? o.weakAreas.filter((w) => typeof w === "string").slice(0, 10).map((w) => (w as string).slice(0, 80))
        : undefined,
    };

    const data = await generateJSON<StudyPlan>(
      studyPlanPrompt(theInput, locale, profile, safeOptions),
      STUDY_PLAN_SHAPE
    );
    if (!Array.isArray(data.days) || !data.days.length)
      return json({ error: "No se pudo generar el plan." }, 502, rl);
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "StudyPlan", rl);
  }
}
