import { generateJSON } from "@/lib/ai";
import { mindMapPrompt, MINDMAP_SHAPE, type ProfileInput } from "@/lib/prompts";
import { json, readJson, requireText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { MindMap } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "mindmap" });

    const { topic, locale, profile } = await readJson<{ topic?: string; locale?: string; profile?: ProfileInput }>(req);
    const theTopic = requireText(topic, "Falta el tema", { max: 500 });

    const data = await generateJSON<MindMap>(mindMapPrompt(theTopic, locale, profile), MINDMAP_SHAPE);
    if (!Array.isArray(data.branches) || !data.branches.length)
      return json({ error: "No se pudo generar el mapa." }, 502, rl);
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "MindMap", rl);
  }
}
