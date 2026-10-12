import { generateJSON, generateText } from "@/lib/ai";
import { diagnosticPrompt, DIAGNOSTIC_SHAPE, diagnosticPlanPrompt } from "@/lib/prompts";
import { json, readJson, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { DiagnosticQuestion } from "@/lib/types";

export const maxDuration = 60;

const cleanAreas = (v: unknown, max = 8): string[] =>
  Array.isArray(v) ? v.filter((a) => typeof a === "string").slice(0, max).map((a) => a.slice(0, 60)) : [];

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "diagnostic" });

    const body = await readJson<{
      mode?: "quiz" | "plan";
      areas?: unknown;
      weakAreas?: unknown;
      strongAreas?: unknown;
      locale?: string;
    }>(req);

    if (body.mode === "plan") {
      const text = await generateText(
        diagnosticPlanPrompt(cleanAreas(body.weakAreas), cleanAreas(body.strongAreas), body.locale),
        "Eres un asesor académico empático."
      );
      if (!text.trim()) return json({ error: "No se pudo generar el plan." }, 502, rl);
      return json({ plan: text }, 200, rl);
    }

    const areas = cleanAreas(body.areas);
    const data = await generateJSON<{ questions: DiagnosticQuestion[] }>(
      diagnosticPrompt(areas.length ? areas : ["Programación", "Cálculo", "Física"], body.locale),
      DIAGNOSTIC_SHAPE
    );
    if (!Array.isArray(data.questions) || !data.questions.length)
      return json({ error: "No se pudieron generar preguntas." }, 502, rl);
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "Diagnostic", rl);
  }
}
