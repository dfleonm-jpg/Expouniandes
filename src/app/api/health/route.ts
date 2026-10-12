// Endpoint de diagnóstico. Indica si la IA está lista SIN revelar
// detalles de infraestructura (qué proveedor, claves, etc.).
// No lee cabeceras ni hace llamadas de IA, así que no necesita rate limiting.

import { json } from "@/lib/api-helpers";

export async function GET() {
  const ready = Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
  return json(
    {
      ok: ready,
      message: ready
        ? "IA lista."
        : "La IA no está configurada. Añade GROQ_API_KEY en las variables de entorno.",
    },
    ready ? 200 : 503
  );
}
