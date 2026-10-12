// Endpoint de diagnóstico. Indica si la IA está lista SIN revelar
// detalles de infraestructura (qué proveedor, claves, etc.).

import { enforceRateLimit, handleApiErrorWithHeaders, json } from "@/lib/api-helpers";


export async function GET(req: Request) {
  let rl: Record<string, string> = {};
  try {
    rl = enforceRateLimit(req, { limit: 60, windowMs: 60_000, bucket: "health" });

    const ready = Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
    return json(
      {
        ok: ready,
        message: ready
          ? "IA lista."
          : "La IA no está configurada. Añade GROQ_API_KEY en las variables de entorno.",
      },
      ready ? 200 : 503,
      rl
    );
  } catch (err) {
    return handleApiErrorWithHeaders(err, "Health", rl);
  }
}
