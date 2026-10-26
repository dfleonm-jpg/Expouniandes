"use client";

import { useState } from "react";
import { Play, Pause, Square, Headphones, Gauge } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useSpeech } from "@/lib/useSpeech";

/**
 * Reproductor de audio-resumen: convierte un texto en una locución natural
 * con play/pausa, control de velocidad y selección de voz (Web Speech API).
 */
export function AudioPlayer({ text }: { text: string }) {
  const { t, locale } = useApp();
  const sp = useSpeech(locale);
  const [voiceIdx, setVoiceIdx] = useState(0);

  if (!sp.supported) return null;

  const rates = [0.8, 1, 1.25, 1.5];

  function toggle() {
    if (sp.speaking && !sp.paused) sp.pause();
    else if (sp.paused) sp.resume();
    else {
      if (sp.voices[voiceIdx]) sp.setVoice(sp.voices[voiceIdx]);
      sp.speak(text);
    }
  }

  return (
    <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
      <span className="flex items-center gap-1.5 text-sm font-medium text-accent">
        <Headphones className="h-4 w-4" />
        {t.audio.title}
      </span>

      <button
        onClick={toggle}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-white transition hover:opacity-90"
        aria-label={sp.speaking && !sp.paused ? t.audio.pause : t.audio.play}
      >
        {sp.speaking && !sp.paused ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
      </button>

      {(sp.speaking || sp.paused) && (
        <button
          onClick={sp.stop}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-foreground transition hover:bg-white/20"
          aria-label={t.audio.stop}
        >
          <Square className="h-4 w-4 fill-current" />
        </button>
      )}

      {/* Velocidad */}
      <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
        <Gauge className="ml-1 h-3.5 w-3.5 text-muted" />
        {rates.map((r) => (
          <button
            key={r}
            onClick={() => sp.setRate(r)}
            className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition ${
              sp.rate === r ? "bg-brand/30 text-brand" : "text-muted hover:text-foreground"
            }`}
          >
            {r}×
          </button>
        ))}
      </div>

      {/* Voz (si hay varias) */}
      {sp.voices.length > 1 && (
        <select
          value={voiceIdx}
          onChange={(e) => {
            const i = Number(e.target.value);
            setVoiceIdx(i);
            sp.setVoice(sp.voices[i]);
          }}
          className="glass max-w-[140px] rounded-lg px-2 py-1.5 text-xs text-foreground [color-scheme:dark] focus:outline-none"
        >
          {sp.voices.map((v, i) => (
            <option key={v.name} value={i}>
              {v.name.replace(/\s*\(.*?\)/, "").slice(0, 22)}
            </option>
          ))}
        </select>
      )}

      {(sp.speaking || sp.paused) && (
        <span className="flex items-center gap-1 text-xs text-muted">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          {sp.paused ? t.audio.paused : t.audio.playing}
        </span>
      )}
    </div>
  );
}
