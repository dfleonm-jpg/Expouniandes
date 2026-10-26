"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const LOCALE_TO_LANG: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
  fr: "fr-FR",
};

/** Limpia markdown/LaTeX para una lectura en voz más natural. */
export function cleanForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ". ") // bloques de código → pausa
    .replace(/\$\$?([^$]+)\$\$?/g, "$1") // quita delimitadores LaTeX
    .replace(/[#*_`>~]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export type SpeechState = {
  supported: boolean;
  speaking: boolean;
  paused: boolean;
  voices: SpeechSynthesisVoice[];
};

/**
 * Hook de síntesis de voz (TTS) reutilizable: play, pause, resume, stop,
 * control de velocidad y selección de voz. Usa la Web Speech API del navegador.
 */
export function useSpeech(locale: string) {
  const [state, setState] = useState<SpeechState>({ supported: false, speaking: false, paused: false, voices: [] });
  const [rate, setRate] = useState(1);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const supported = typeof window !== "undefined" && "speechSynthesis" in window;
    if (!supported) {
      setState((s) => ({ ...s, supported: false }));
      return;
    }
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const all = synth.getVoices();
      const lang = (LOCALE_TO_LANG[locale] ?? "es-ES").slice(0, 2);
      const matching = all.filter((v) => v.lang.startsWith(lang));
      setState((s) => ({ ...s, supported: true, voices: matching.length ? matching : all }));
    };
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
      synth.cancel();
    };
  }, [locale]);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setState((s) => ({ ...s, speaking: false, paused: false }));
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const clean = cleanForSpeech(text);
      if (!clean) return;
      // Divide en frases para locuciones largas más estables.
      const chunks = clean.match(/[^.!?]+[.!?]*/g)?.filter((c) => c.trim()) ?? [clean];
      const lang = LOCALE_TO_LANG[locale] ?? "es-ES";
      let idx = 0;
      const speakNext = () => {
        if (idx >= chunks.length) {
          setState((s) => ({ ...s, speaking: false, paused: false }));
          return;
        }
        const u = new SpeechSynthesisUtterance(chunks[idx].trim());
        u.lang = lang;
        u.rate = rate;
        if (voiceRef.current) u.voice = voiceRef.current;
        u.onend = () => {
          idx++;
          speakNext();
        };
        u.onerror = () => setState((s) => ({ ...s, speaking: false, paused: false }));
        synth.speak(u);
      };
      setState((s) => ({ ...s, speaking: true, paused: false }));
      speakNext();
    },
    [locale, rate]
  );

  const pause = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.pause();
    setState((s) => ({ ...s, paused: true }));
  }, []);

  const resume = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.resume();
    setState((s) => ({ ...s, paused: false }));
  }, []);

  const setVoice = useCallback((v: SpeechSynthesisVoice | null) => {
    voiceRef.current = v;
  }, []);

  return { ...state, rate, setRate, speak, pause, resume, stop, setVoice };
}
