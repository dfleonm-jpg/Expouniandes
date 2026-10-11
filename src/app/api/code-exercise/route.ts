import { generateJSON } from "@/lib/ai";
import { codeExercisePrompt, CODE_EXERCISE_SHAPE } from "@/lib/prompts";
import { json, handleApiError } from "@/lib/api-helpers";
import type { CodeExercise } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { topic, level, restrictions, locale } = (await req.json()) as {
      topic?: string;
      level?: string;
      restrictions?: string[];
      locale?: string;
    };
    const data = await generateJSON<CodeExercise>(
      codeExercisePrompt(topic ?? "", level ?? "básico", restrictions ?? [], locale),
      CODE_EXERCISE_SHAPE
    );
    return json(data);
  } catch (err) {
    return handleApiError(err, "CodeExercise");
  }
}
