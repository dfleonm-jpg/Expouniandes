import { streamChat, type ChatMessage } from "@/lib/ai";
import { tutorSystem, type ProfileInput } from "@/lib/prompts";
import { json, handleApiError } from "@/lib/api-helpers";

export async function POST(req: Request) {
  try {
    const { messages, locale, context, profile } = (await req.json()) as {
      messages: ChatMessage[];
      locale?: string;
      context?: string;
      profile?: ProfileInput;
    };

    if (!messages?.length) return json({ error: "No hay mensajes" }, 400);

    let system = tutorSystem(locale, profile);
    if (context?.trim()) {
      system += `\n\nCONTEXTO/DOCUMENTO DEL ESTUDIANTE (úsalo como fuente principal):\n"""\n${context.slice(0, 40000)}\n"""`;
    }

    const stream = await streamChat(messages, system);
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    return handleApiError(err, "Chat");
  }
}
