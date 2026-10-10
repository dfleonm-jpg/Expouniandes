import { generateText, LANGUAGE_NAMES } from "@/lib/ai";
import { json, handleApiError } from "@/lib/api-helpers";

export async function POST(req: Request) {
  try {
    const { locale, mood } = (await req.json()) as { locale?: string; mood?: string };
    const lang = LANGUAGE_NAMES[locale ?? "es"] ?? "español";

    const moodNote = mood ? ` El estudiante se siente: ${mood}. Ten eso en cuenta con empatía.` : "";
    const system = `Eres Sereno, un tutor empático. Devuelve UNA sola frase motivadora, corta (máximo 20 palabras), cálida y original, para animar a un estudiante universitario a estudiar sin estrés. Escríbela en ${lang}. Sin comillas, sin autor, solo la frase.${moodNote}`;

    const text = await generateText("Dame una frase motivadora para hoy.", system);
    return json({ quote: text.replace(/^["'“]|["'”]$/g, "").trim() });
  } catch (err) {
    return handleApiError(err, "Quote");
  }
}
