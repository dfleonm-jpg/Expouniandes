"use client";

import { useRef, useCallback } from "react";
import { STREAM_ERROR_MARKER } from "./stream-protocol";

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
          const msg =
            (payload as { error?: string }).error ||
            (res.status === 429
              ? "Vas muy rápido. Espera unos segundos."
              : "La IA no está disponible ahora mismo. Intenta de nuevo.");
          return { ok: false, text: "", error: msg };
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });

          // Si el servidor insertó el marcador de error, la respuesta se
          // cortó a mitad: devolvemos lo acumulado pero marcando el fallo.
          const markerAt = acc.indexOf(STREAM_ERROR_MARKER);
          if (markerAt !== -1) {
            const clean = acc.slice(0, markerAt);
            onToken(clean);
            return {
              ok: false,
              text: clean,
              error: "La respuesta se interrumpió. Intenta de nuevo.",
            };
          }
          onToken(acc);
        }
        return { ok: true, text: acc };
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return { ok: true, text: "" };
        // Fallo de red / sin conexión.
        return {
          ok: false,
          text: "",
          error: "No se pudo conectar. Revisa tu conexión a internet.",
        };
      } finally {
        abortRef.current = null;
      }
    },
    []
  );

  return { stream, stop };
}
