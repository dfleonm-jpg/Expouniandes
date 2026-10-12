import { generateJSON } from "@/lib/ai";
import { summaryPrompt, SUMMARY_SHAPE } from "@/lib/prompts";
import { json, readJson, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { SummaryResult } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "summary" });

    const { text, locale } = await readJson<{ text?: string; locale?: string }>(req);
    if (!text?.trim() || text.trim().length < 40) {
      return json({ error: "Pega un texto más largo para resumir (mínimo ~40 caracteres)." }, 400, rl);
    }

    const data = await generateJSON<SummaryResult>(summaryPrompt(text.slice(0, 40000), locale), SUMMARY_SHAPE);
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "Summary", rl);
  }
}
