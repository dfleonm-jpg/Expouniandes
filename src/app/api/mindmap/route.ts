import { generateJSON } from "@/lib/ai";
import { mindMapPrompt, MINDMAP_SHAPE } from "@/lib/prompts";
import { json, readJson, requireText, enforceRateLimit, handleApiErrorWithHeaders } from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";
import type { MindMap } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.ai, bucket: "mindmap" });

    const { topic, locale } = await readJson<{ topic?: string; locale?: string }>(req);
    const theTopic = requireText(topic, "Falta el tema", { max: 500 });

    const data = await generateJSON<MindMap>(mindMapPrompt(theTopic, locale), MINDMAP_SHAPE);
    if (!Array.isArray(data.branches) || !data.branches.length)
      return json({ error: "No se pudo generar el mapa." }, 502, rl);
    return json(data, 200, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "MindMap", rl);
  }
}
