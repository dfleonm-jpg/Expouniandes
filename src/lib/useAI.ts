"use client";

import { useState, useCallback } from "react";
import { withProfile } from "./ai-profile";

/**
 * Hook genérico para llamar endpoints de IA que devuelven JSON,
 * con estado de carga y error legible.
 */
export function useAIRequest<TResult>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TResult | null>(null);

  const run = useCallback(
    async (url: string, body: unknown, opts?: { timeoutMs?: number }): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      // Timeout de cliente generoso (las tareas de IA pueden tardar).
      const timeoutMs = opts?.timeoutMs ?? 70000;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(withProfile(body)),
          signal: controller.signal,
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(
            (payload as { error?: string }).error ||
              (res.status === 429
                ? "Vas muy rápido. Espera unos segundos e intenta de nuevo."
                : "La IA tardó demasiado o no está disponible. Intenta de nuevo.")
          );
          return null;
        }
        setData(payload as TResult);
        return payload as TResult;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          setError("La IA está tardando más de lo normal. Vuelve a intentarlo en un momento.");
        } else {
          setError("No se pudo conectar. Revisa tu conexión e intenta de nuevo.");
        }
        return null;
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, error, data, run, reset, setError };
}
