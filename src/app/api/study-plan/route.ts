import { generateJSON } from "@/lib/ai";
import { studyPlanPrompt, STUDY_PLAN_SHAPE } from "@/lib/prompts";
import { json, handleApiError } from "@/lib/api-helpers";
import type { StudyPlan } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { input, locale } = (await req.json()) as { input: string; locale?: string };
    if (!input?.trim()) return json({ error: "Describe qué necesitas estudiar." }, 400);

    const data = await generateJSON<StudyPlan>(studyPlanPrompt(input, locale), STUDY_PLAN_SHAPE);
    if (!data.days?.length) return json({ error: "No se pudo generar el plan." }, 502);
    return json(data);
  } catch (err) {
    return handleApiError(err, "StudyPlan");
  }
}
