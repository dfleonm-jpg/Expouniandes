import { generateJSON } from "@/lib/ai";
import { flashcardsPrompt, FLASHCARDS_SHAPE } from "@/lib/prompts";
import { json, handleApiError } from "@/lib/api-helpers";
import type { Flashcard } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { topic, count, locale } = (await req.json()) as {
      topic: string;
      count: number;
      locale?: string;
    };

    if (!topic?.trim()) return json({ error: "Falta el tema" }, 400);

    const n = Math.min(Math.max(Number(count) || 8, 4), 20);
    const data = await generateJSON<{ cards: Flashcard[] }>(
      flashcardsPrompt(topic, n, locale),
      FLASHCARDS_SHAPE
    );

    if (!data.cards?.length) return json({ error: "No se pudieron generar flashcards." }, 502);
    return json(data);
  } catch (err) {
    return handleApiError(err, "Flashcards");
  }
}
