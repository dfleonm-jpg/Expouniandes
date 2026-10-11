"use client";

import { useRef, useCallback } from "react";

/**
 * Hook compartido para consumir respuestas de IA en streaming.
 * Hace el POST, lee el ReadableStream token a token y llama a `onToken`
 * con el texto acumulado. Soporta cancelación con AbortController.
 *
 * Devuelve `{ stream, stop }`:
 *  - stream(url, body, onToken) -> Promise<{ ok, text, error? }>
 *  - stop() cancela la petición en curso.
 */
export function useChatStream() {
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const stream = useCallback(
    async (
      url: string,
      body: unknown,
      onToken: (acc: string) => void
    ): Promise<{ ok: boolean; text: string; error?: string }> => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const payload = await res.json().catch(() => ({}));
          return { ok: false, text: "", error: (payload as { error?: string }).error };
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          onToken(acc);
        }
        return { ok: true, text: acc };
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return { ok: true, text: "" };
        return { ok: false, text: "", error: undefined };
      } finally {
        abortRef.current = null;
      }
    },
    []
  );

  return { stream, stop };
}
