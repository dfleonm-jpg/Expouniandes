import { generateJSON } from "@/lib/ai";
import { mathProblemPrompt, MATH_PROBLEM_SHAPE } from "@/lib/prompts";
import { json, handleApiError } from "@/lib/api-helpers";
import type { MathProblem } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { topic, difficulty, locale } = (await req.json()) as {
      topic: string;
      difficulty?: string;
      locale?: string;
    };
    if (!topic?.trim()) return json({ error: "Elige un tema." }, 400);

    const data = await generateJSON<MathProblem>(
      mathProblemPrompt(topic, difficulty ?? "media", locale),
      MATH_PROBLEM_SHAPE
    );
    return json(data);
  } catch (err) {
    return handleApiError(err, "MathProblem");
  }
}
