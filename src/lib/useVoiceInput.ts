"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const LOCALE_TO_LANG: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
  fr: "fr-FR",
};

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Dictado por voz (speech-to-text) con la Web Speech API.
 * Expone start/stop explícitos (más predecibles que un toggle que depende del
 * estado) y reporta errores de permiso para que la UI pueda reaccionar.
 */
export function useVoiceInput(
  locale: string,
  onResult: (text: string) => void,
  opts?: { onError?: (kind: "denied" | "nospeech" | "other") => void; onEnd?: () => void }
) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);
  const startingRef = useRef(false);     // evita dobles start()
  const manualStopRef = useRef(false);   // distingue stop() manual de fin natural

  // Refs a los callbacks para no recrear start/stop en cada render.
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(opts?.onError);
  const onEndRef = useRef(opts?.onEnd);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onErrorRef.current = opts?.onError; }, [opts?.onError]);
  useEffect(() => { onEndRef.current = opts?.onEnd; }, [opts?.onEnd]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(Boolean(SR));
    return () => {
      try { recRef.current?.abort?.(); } catch { /* noop */ }
    };
  }, []);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    try { recRef.current?.stop?.(); } catch { /* noop */ }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (startingRef.current) return; // ya hay un arranque en curso

    // Siempre un reconocedor nuevo: reusar uno viejo causa InvalidStateError en móvil.
    try {
      recRef.current?.abort?.();
    } catch { /* noop */ }
    const rec = new SR();
    rec.lang = LOCALE_TO_LANG[locale] ?? "es-ES";
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      const last = e.results?.[e.results.length - 1];
      const text = last?.[0]?.transcript ?? "";
      if (text && text.trim()) onResultRef.current?.(text.trim());
    };
    rec.onstart = () => {
      startingRef.current = false;
      setListening(true);
    };
    rec.onend = () => {
      startingRef.current = false;
      setListening(false);
      onEndRef.current?.();
    };
    rec.onerror = (e: any) => {
      startingRef.current = false;
      setListening(false);
      const err = e?.error;
      if (err === "not-allowed" || err === "service-not-allowed") onErrorRef.current?.("denied");
      else if (err === "no-speech") onErrorRef.current?.("nospeech");
      else if (err !== "aborted") onErrorRef.current?.("other");
    };

    recRef.current = rec;
    manualStopRef.current = false;
    startingRef.current = true;
    try {
      rec.start();
    } catch {
      // InvalidStateError: aborta y deja listo para el próximo intento.
      startingRef.current = false;
      try { rec.abort?.(); } catch { /* noop */ }
      setListening(false);
    }
  }, [locale]);

  // Compatibilidad: toggle alterna start/stop.
  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { listening, supported, start, stop, toggle };
}
