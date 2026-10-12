import { generateJSON } from "@/lib/ai";
import { mathReviewPrompt, MATH_REVIEW_SHAPE } from "@/lib/prompts";
import { json, readJson, requireText, clampText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { MathReview } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "math-review" });

    const { problem, answer, work, locale } = await readJson<{
      problem?: string;
      answer?: string;
      work?: string;
      locale?: string;
    }>(req);
    const theWork = requireText(work, "Escribe tu procedimiento.", { max: 8000 });

    const data = await generateJSON<MathReview>(
      mathReviewPrompt(clampText(problem, 2000), clampText(answer, 1000), theWork, locale),
      MATH_REVIEW_SHAPE
    );
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "MathReview", rl);
  }
}
