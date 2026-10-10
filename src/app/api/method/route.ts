import { generateText } from "@/lib/ai";
import { methodRecommendPrompt } from "@/lib/prompts";
import { json, handleApiError } from "@/lib/api-helpers";

export async function POST(req: Request) {
  try {
    const { situation, locale } = (await req.json()) as { situation: string; locale?: string };
    if (!situation?.trim()) return json({ error: "Describe tu situación." }, 400);

    const text = await generateText(
      methodRecommendPrompt(situation, locale),
      "Eres un asesor de estudio experto y empático."
    );
    return json({ recommendation: text });
  } catch (err) {
    return handleApiError(err, "Method");
  }
}
