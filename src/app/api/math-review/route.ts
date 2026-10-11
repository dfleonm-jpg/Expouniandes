import { generateJSON } from "@/lib/ai";
import { mathReviewPrompt, MATH_REVIEW_SHAPE } from "@/lib/prompts";
import { json, handleApiError } from "@/lib/api-helpers";
import type { MathReview } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { problem, answer, work, locale } = (await req.json()) as {
      problem: string;
      answer: string;
      work: string;
      locale?: string;
    };
    if (!work?.trim()) return json({ error: "Escribe tu procedimiento." }, 400);

    const data = await generateJSON<MathReview>(
      mathReviewPrompt(problem ?? "", answer ?? "", work, locale),
      MATH_REVIEW_SHAPE
    );
    return json(data);
  } catch (err) {
    return handleApiError(err, "MathReview");
  }
}
