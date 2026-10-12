import { generateJSON } from "@/lib/ai";
import { mathProblemPrompt, MATH_PROBLEM_SHAPE } from "@/lib/prompts";
import { json, readJson, requireText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { MathProblem } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "math-problem" });

    const { topic, difficulty, locale } = await readJson<{
      topic?: string;
      difficulty?: string;
      locale?: string;
    }>(req);
    const theTopic = requireText(topic, "Elige un tema.", { max: 300 });

    const data = await generateJSON<MathProblem>(
      mathProblemPrompt(theTopic, difficulty ?? "media", locale),
      MATH_PROBLEM_SHAPE
    );
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "MathProblem", rl);
  }
}
