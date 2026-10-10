import { generateJSON } from "@/lib/ai";
import { mindMapPrompt, MINDMAP_SHAPE } from "@/lib/prompts";
import { json, handleApiError } from "@/lib/api-helpers";
import type { MindMap } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { topic, locale } = (await req.json()) as { topic: string; locale?: string };
    if (!topic?.trim()) return json({ error: "Falta el tema" }, 400);

    const data = await generateJSON<MindMap>(mindMapPrompt(topic, locale), MINDMAP_SHAPE);
    if (!data.branches?.length) return json({ error: "No se pudo generar el mapa." }, 502);
    return json(data);
  } catch (err) {
    return handleApiError(err, "MindMap");
  }
}
