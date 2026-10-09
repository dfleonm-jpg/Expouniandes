import { AIError } from "./ai";

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function handleApiError(err: unknown, label: string) {
  console.error(`${label} error:`, err);
  if (err instanceof AIError) return json({ error: err.userMessage }, err.status);
  const message = err instanceof Error ? err.message : "Error desconocido";
  return json({ error: `Algo salió mal: ${message}` }, 500);
}
