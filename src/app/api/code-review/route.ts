import { generateJSON } from "@/lib/ai";
import { codeReviewPrompt, CODE_REVIEW_SHAPE } from "@/lib/prompts";
import { json, handleApiError } from "@/lib/api-helpers";
import type { CodeReview } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { statement, code, restrictions, locale } = (await req.json()) as {
      statement: string;
      code: string;
      restrictions?: string[];
      locale?: string;
    };
    if (!code?.trim()) return json({ error: "Escribe tu código primero." }, 400);

    const data = await generateJSON<CodeReview>(
      codeReviewPrompt(statement ?? "", code, restrictions ?? [], locale),
      CODE_REVIEW_SHAPE
    );
    return json(data);
  } catch (err) {
    return handleApiError(err, "CodeReview");
  }
}
