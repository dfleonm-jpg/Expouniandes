import { generateText } from "@/lib/ai";
import { methodRecommendPrompt } from "@/lib/prompts";
import { json, readJson, requireText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "method" });

    const { situation, locale } = await readJson<{ situation?: string; locale?: string }>(req);
    const theSituation = requireText(situation, "Describe tu situación.", { max: 2000 });

    const text = await generateText(
      methodRecommendPrompt(theSituation, locale),
      "Eres un asesor de estudio experto y empático."
    );
    if (!text.trim()) return json({ error: "No se pudo generar una recomendación." }, 502, rl);
    return json({ recommendation: text }, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "Method", rl);
  }
}
