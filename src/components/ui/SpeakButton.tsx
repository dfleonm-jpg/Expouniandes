"use client";

import { useState, useEffect, useCallback } from "react";
import { Volume2, Square } from "lucide-react";
import { useApp } from "@/lib/app-context";

const LOCALE_TO_LANG: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
  fr: "fr-FR",
};

/** Botón de lectura en voz alta (text-to-speech) usando la Web Speech API. */
export function SpeakButton({ text, label }: { text: string; label?: string }) {
  const { locale, t } = useApp();
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;

    if (synth.speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }

    // Limpia markdown básico para una lectura más natural.
    const clean = text
      .replace(/[#*_`>~]/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .trim();
    if (!clean) return;

    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = LOCALE_TO_LANG[locale] ?? "es-ES";
    const match = synth.getVoices().find((v) => v.lang.startsWith(utter.lang.slice(0, 2)));
    if (match) utter.voice = match;
    utter.rate = 1;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);

    synth.speak(utter);
    setSpeaking(true);
  }, [text, locale]);

  if (!supported) return null;

  return (
    <button
      onClick={speak}
      aria-label={label ?? "Leer en voz alta"}
      className="flex items-center gap-1 text-xs text-muted transition hover:text-foreground"
    >
      {speaking ? <Square className="h-3 w-3 fill-current" /> : <Volume2 className="h-3 w-3" />}
      {label ?? (speaking ? t.ui.stop : "🔊")}
    </button>
  );
}
