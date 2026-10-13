import { streamChat } from "@/lib/ai";
import { tutorSystem, type ProfileInput, type ExplainLevel } from "@/lib/prompts";
import {
  json,
  streamResponse,
  readJson,
  sanitizeMessages,
  clampText,
  enforceRateLimit,
  handleApiErrorWithHeaders,
} from "@/lib/api-helpers";
import { RATE_PROFILES } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { ...RATE_PROFILES.stream, bucket: "chat" });

    const { messages, locale, context, profile, level } = await readJson<{
      messages?: unknown;
      locale?: string;
      context?: string;
      profile?: ProfileInput;
      level?: ExplainLevel;
    }>(req);

    const safeMessages = sanitizeMessages(messages);
    if (!safeMessages.length) return json({ error: "No hay mensajes" }, 400, rl);

    const safeLevel = level === "basico" || level === "intermedio" || level === "avanzado" ? level : undefined;
    let system = tutorSystem(locale, profile, safeLevel);
    const ctx = clampText(context, 40000);
    if (ctx.trim()) {
      system += `\n\nCONTEXTO/DOCUMENTO DEL ESTUDIANTE (úsalo como fuente principal):\n"""\n${ctx}\n"""`;
    }

    const stream = await streamChat(safeMessages, system);
    return streamResponse(stream, rl);
  } catch (err) {
    return handleApiErrorWithHeaders(err, "Chat", rl);
  }
}
