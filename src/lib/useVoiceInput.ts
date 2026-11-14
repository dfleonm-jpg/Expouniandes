"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const LOCALE_TO_LANG: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
  fr: "fr-FR",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Dictado por voz (speech-to-text) con la Web Speech API. */
export function useVoiceInput(locale: string, onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(Boolean(SR));
  }, []);

  const toggle = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (listening) {
      try { recRef.current?.stop(); } catch { /* noop */ }
      setListening(false);
      return;
    }

    // Reutiliza o crea el reconocedor.
    const rec = recRef.current ?? new SR();
    rec.lang = LOCALE_TO_LANG[locale] ?? "es-ES";
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results?.[e.results.length - 1]?.[0]?.transcript ?? "";
      if (text) onResult(text.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => {
      // "no-speech"/"aborted" son normales; no los tratamos como fallo ruidoso.
      setListening(false);
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      // "InvalidStateError": ya estaba iniciado; lo reiniciamos limpio.
      try { rec.stop(); } catch { /* noop */ }
      setListening(false);
    }
  }, [listening, locale, onResult]);

  return { listening, supported, toggle };
}
