import { generateJSON } from "@/lib/ai";
import { flashcardsPrompt, FLASHCARDS_SHAPE, type ProfileInput } from "@/lib/prompts";
import { json, readJson, requireText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { Flashcard } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "flashcards" });

    const { topic, count, locale, profile } = await readJson<{
      topic?: string;
      count?: number;
      locale?: string;
      profile?: ProfileInput;
    }>(req);
    const theTopic = requireText(topic, "Falta el tema", { max: 500 });

    const n = Math.min(Math.max(Number(count) || 8, 4), 20);
    const data = await generateJSON<{ cards: Flashcard[] }>(flashcardsPrompt(theTopic, n, locale, profile), FLASHCARDS_SHAPE);

    if (!Array.isArray(data.cards) || !data.cards.length)
      return json({ error: "No se pudieron generar flashcards." }, 502, rl);
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "Flashcards", rl);
  }
}
