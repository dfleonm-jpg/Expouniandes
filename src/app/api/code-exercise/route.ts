import { generateJSON } from "@/lib/ai";
import { codeExercisePrompt, CODE_EXERCISE_SHAPE, type ProfileInput } from "@/lib/prompts";
import { json, readJson, clampText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { CodeExercise } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "code-exercise" });

    const { topic, level, restrictions, locale, profile, language } = await readJson<{
      topic?: string;
      level?: string;
      restrictions?: string[];
      locale?: string;
      profile?: ProfileInput;
      language?: string;
    }>(req);

    const safeRestrictions = Array.isArray(restrictions)
      ? restrictions.filter((r) => typeof r === "string").slice(0, 10).map((r) => r.slice(0, 100))
      : [];

    const data = await generateJSON<CodeExercise>(
      codeExercisePrompt(clampText(topic, 300), level ?? "básico", safeRestrictions, locale, profile, clampText(language, 30)),
      CODE_EXERCISE_SHAPE
    );
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "CodeExercise", rl);
  }
}
