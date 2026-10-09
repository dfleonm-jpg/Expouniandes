"use client";

import { useState, useCallback } from "react";

/**
 * Hook genérico para llamar endpoints de IA que devuelven JSON,
 * con estado de carga y error legible.
 */
export function useAIRequest<TResult>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TResult | null>(null);

  const run = useCallback(async (url: string, body: unknown): Promise<TResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || "Algo salió mal. Intenta de nuevo.");
        return null;
      }
      setData(payload as TResult);
      return payload as TResult;
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, error, data, run, reset, setError };
}
