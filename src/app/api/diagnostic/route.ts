import { generateJSON, generateText } from "@/lib/ai";
import { diagnosticPrompt, DIAGNOSTIC_SHAPE, diagnosticPlanPrompt } from "@/lib/prompts";
import { json, handleApiError } from "@/lib/api-helpers";
import type { DiagnosticQuestion } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      mode: "quiz" | "plan";
      areas?: string[];
      weakAreas?: string[];
      strongAreas?: string[];
      locale?: string;
    };

    if (body.mode === "plan") {
      const text = await generateText(
        diagnosticPlanPrompt(body.weakAreas ?? [], body.strongAreas ?? [], body.locale),
        "Eres un asesor académico empático."
      );
      return json({ plan: text });
    }

    const areas = body.areas?.length ? body.areas : ["Programación", "Cálculo", "Física"];
    const data = await generateJSON<{ questions: DiagnosticQuestion[] }>(
      diagnosticPrompt(areas, body.locale),
      DIAGNOSTIC_SHAPE
    );
    return json(data);
  } catch (err) {
    return handleApiError(err, "Diagnostic");
  }
}
