import { generateText, LANGUAGE_NAMES } from "@/lib/ai";
import { json, readJson, clampText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";

export const maxDuration = 30;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "quote" });

    const { locale, mood } = await readJson<{ locale?: string; mood?: string }>(req);
    const lang = LANGUAGE_NAMES[locale ?? "es"] ?? "español";

    const cleanMood = clampText(mood, 100);
    const moodNote = cleanMood ? ` El estudiante se siente: ${cleanMood}. Ten eso en cuenta con empatía.` : "";
    const system = `Eres Sereno, un tutor empático. Devuelve UNA sola frase motivadora, corta (máximo 20 palabras), cálida y original, para animar a un estudiante universitario a estudiar sin estrés. Escríbela en ${lang}. Sin comillas, sin autor, solo la frase.${moodNote}`;

    const text = await generateText("Dame una frase motivadora para hoy.", system);
    return json({ quote: text.replace(/^["'“]|["'”]$/g, "").trim() }, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "Quote", rl);
  }
}
