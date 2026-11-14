"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const LOCALE_TO_LANG: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
  fr: "fr-FR",
};

// ---- Conversión de números a palabras (para que lea "mil ciento veintitrés"
//      y no "uno uno dos tres") en los 4 idiomas soportados. ----

const ES = {
  u: ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"],
  d: ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"],
  c: ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"],
};

function esBelow1000(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  let out = "";
  const c = Math.floor(n / 100);
  const rest = n % 100;
  if (c) out += ES.c[c];
  if (rest) {
    if (out) out += " ";
    if (rest < 30) out += ES.u[rest];
    else {
      const d = Math.floor(rest / 10);
      const u = rest % 10;
      out += ES.d[d] + (u ? " y " + ES.u[u] : "");
    }
  }
  return out;
}

function esNumberToWords(n: number): string {
  if (n === 0) return "cero";
  if (n < 0) return "menos " + esNumberToWords(-n);
  if (n > 999999999) return String(n); // demasiado grande, se deja igual
  let out = "";
  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const rest = n % 1000;
  if (millions) out += (millions === 1 ? "un millón" : esBelow1000(millions) + " millones") + " ";
  if (thousands) out += (thousands === 1 ? "mil" : esBelow1000(thousands) + " mil") + " ";
  if (rest) out += esBelow1000(rest);
  return out.trim();
}

// Convierte los números de un texto a palabras según el idioma. Para es usa el
// conversor propio; para en/pt/fr usa Intl.NumberFormat con estilo "spellout"
// cuando está disponible (si no, deja el número tal cual).
function numbersToWords(text: string, locale: string): string {
  const spell = (numStr: string): string => {
    const n = Number(numStr.replace(/[.,](?=\d{3}\b)/g, "")); // quita separadores de miles
    if (!Number.isFinite(n) || numStr.length > 12) return numStr;
    if (locale === "es") return esNumberToWords(n);
    try {
      // @ts-expect-error: "spellout" no está en los tipos pero sí en navegadores
      const fmt = new Intl.NumberFormat(LOCALE_TO_LANG[locale] ?? "en-US", { style: "spellout" });
      return fmt.format(n);
    } catch {
      return numStr;
    }
  };
  // Solo números enteros (con posibles separadores de miles). Los decimales y
  // versiones/IP (con puntos internos) se dejan como están para no romperlos.
  return text.replace(/\b\d{1,3}(?:[.,]\d{3})+\b|\b\d+\b/g, (m) => spell(m));
}

/** Limpia markdown/LaTeX y normaliza números para una lectura más natural. */
export function cleanForSpeech(text: string, locale = "es"): string {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, ". ") // bloques de código → pausa
    .replace(/`[^`]*`/g, " ") // código en línea → pausa
    .replace(/\$\$?([^$]+)\$\$?/g, "$1") // quita delimitadores LaTeX
    .replace(/[#*_`>~]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return numbersToWords(cleaned, locale);
}

// Nombres de voces de alta calidad / naturales por plataforma. Se prioriza
// una voz "amigable" sobre la robótica por defecto del sistema.
const PREFERRED_VOICES = [
  // Google (Chrome/Android) y Microsoft (Edge) suelen sonar más naturales.
  "Google español", "Google US English", "Google português", "Google français",
  "Microsoft", "Natural", "Neural",
  // Nombres de voces femeninas cálidas comunes por idioma.
  "Mónica", "Paulina", "Sabina", "Helena", "Luciana", "Francisca",
  "Samantha", "Ava", "Jenny", "Aria", "Amelie", "Camille", "Thomas",
];

/** Escoge la voz más agradable disponible para un idioma. */
function pickFriendlyVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const byLang = voices.filter((v) => v.lang.toLowerCase().startsWith(lang));
  const pool = byLang.length ? byLang : voices;
  // 1) Coincidencia con la lista de voces preferidas (orden de prioridad).
  for (const name of PREFERRED_VOICES) {
    const hit = pool.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
    if (hit) return hit;
  }
  // 2) Prefiere voces locales (mejor latencia y a menudo mejor calidad).
  const local = pool.find((v) => v.localService);
  return local ?? pool[0];
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
  // Chrome congela la síntesis en textos largos (~15s): un "latido" que llama
  // pause()+resume() cada pocos segundos evita que se trabe.
  const keepAlive = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopKeepAlive = () => {
    if (keepAlive.current) { clearInterval(keepAlive.current); keepAlive.current = null; }
  };

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
      const list = matching.length ? matching : all;
      setState((s) => ({ ...s, supported: true, voices: list }));
      // Elige por defecto la voz más natural/amigable disponible para el idioma.
      if (!voiceRef.current && list.length) voiceRef.current = pickFriendlyVoice(list, lang);
    };
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
      stopKeepAlive();
      synth.cancel();
    };
  }, [locale]);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    stopKeepAlive();
    window.speechSynthesis.cancel();
    setState((s) => ({ ...s, speaking: false, paused: false }));
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      stopKeepAlive();
      const clean = cleanForSpeech(text, locale);
      if (!clean) return;
      // Divide en frases para locuciones largas más estables.
      const chunks = clean.match(/[^.!?]+[.!?]*/g)?.filter((c) => c.trim()) ?? [clean];
      const lang = LOCALE_TO_LANG[locale] ?? "es-ES";
      let idx = 0;
      const speakNext = () => {
        if (idx >= chunks.length) {
          stopKeepAlive();
          setState((s) => ({ ...s, speaking: false, paused: false }));
          return;
        }
        const u = new SpeechSynthesisUtterance(chunks[idx].trim());
        u.lang = lang;
        u.rate = rate * 0.95;  // un pelín más pausado = más natural
        u.pitch = 1.06;        // tono ligeramente más cálido/amigable
        if (voiceRef.current) u.voice = voiceRef.current;
        let advanced = false;
        const advance = () => {
          if (advanced) return;
          advanced = true;
          idx++;
          speakNext();
        };
        u.onend = advance;
        u.onerror = () => {
          // Un error puntual no debe cortar toda la locución: pasa al siguiente.
          advance();
        };
        synth.speak(u);
      };
      // Latido anti-congelamiento mientras habla (bug de Chrome en textos largos).
      stopKeepAlive();
      keepAlive.current = setInterval(() => {
        if (synth.speaking && !synth.paused) {
          synth.pause();
          synth.resume();
        }
      }, 9000);
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
