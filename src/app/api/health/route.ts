// Endpoint de diagnóstico. Útil para verificar en producción (Vercel)
// si las claves de IA están correctamente configuradas, SIN exponerlas.

export async function GET() {
  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const provider = hasGroq ? "groq" : hasGemini ? "gemini" : null;

  return new Response(
    JSON.stringify({
      ok: Boolean(provider),
      provider,
      configured: { groq: hasGroq, gemini: hasGemini },
      message: provider
        ? `IA lista usando ${provider}.`
        : "No hay ninguna clave de IA configurada. Añade GROQ_API_KEY en las variables de entorno de Vercel.",
    }),
    {
      status: provider ? 200 : 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}
