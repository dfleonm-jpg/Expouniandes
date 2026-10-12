import { generateJSON } from "@/lib/ai";
import { codeReviewPrompt, CODE_REVIEW_SHAPE } from "@/lib/prompts";
import { json, readJson, requireText, clampText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { CodeReview } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "code-review" });

    const { statement, code, restrictions, locale } = await readJson<{
      statement?: string;
      code?: string;
      restrictions?: string[];
      locale?: string;
    }>(req);
    const theCode = requireText(code, "Escribe tu código primero.", { max: 10000 });

    const safeRestrictions = Array.isArray(restrictions)
      ? restrictions.filter((r) => typeof r === "string").slice(0, 10).map((r) => r.slice(0, 100))
      : [];

    const data = await generateJSON<CodeReview>(
      codeReviewPrompt(clampText(statement, 2000), theCode, safeRestrictions, locale),
      CODE_REVIEW_SHAPE
    );
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "CodeReview", rl);
  }
}
