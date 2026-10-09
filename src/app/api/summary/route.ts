import { generateJSON } from "@/lib/ai";
import { summaryPrompt, SUMMARY_SHAPE } from "@/lib/prompts";
import { json, handleApiError } from "@/lib/api-helpers";
import type { SummaryResult } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { text, locale } = (await req.json()) as { text: string; locale?: string };
    if (!text?.trim() || text.trim().length < 40) {
      return json({ error: "Pega un texto más largo para resumir (mínimo ~40 caracteres)." }, 400);
    }

    const data = await generateJSON<SummaryResult>(summaryPrompt(text, locale), SUMMARY_SHAPE);
    return json(data);
  } catch (err) {
    return handleApiError(err, "Summary");
  }
}
