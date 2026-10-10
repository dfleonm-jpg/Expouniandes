"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  Wind,
  Moon,
  Coffee,
  Users,
  BookOpen,
  Smile,
  Quote,
  RefreshCw,
  Loader2,
  CloudRain,
  Trees,
  Waves,
  CupSoda,
  VolumeX,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";
import { AmbientSound, type SoundType } from "@/lib/ambient-sound";
import { cn } from "@/lib/utils";

type Phase = "in" | "hold" | "out";

// Tres técnicas de respiración con sus tiempos (segundos).
const TECHNIQUES: Record<string, { in: number; hold: number; out: number }> = {
  "478": { in: 4, hold: 7, out: 8 },
  box: { in: 4, hold: 4, out: 4 },
  calm: { in: 4, hold: 4, out: 6 },
};

const TIPS: Record<string, { icon: typeof Moon; text: string }[]> = {
  es: [
    { icon: Moon, text: "Duerme 7-8 horas: la memoria se consolida mientras descansas." },
    { icon: Coffee, text: "Haz pausas de 5 min cada 25 min de estudio (Pomodoro)." },
    { icon: BookOpen, text: "Divide temas grandes en partes pequeñas y alcanzables." },
    { icon: Users, text: "Habla con alguien si te sientes abrumado. Pedir ayuda es de valientes." },
    { icon: Smile, text: "Celebra tus pequeños logros, no solo las metas grandes." },
  ],
  en: [
    { icon: Moon, text: "Sleep 7-8 hours: memory consolidates while you rest." },
    { icon: Coffee, text: "Take 5-min breaks every 25 min of study (Pomodoro)." },
    { icon: BookOpen, text: "Break big topics into small, achievable parts." },
    { icon: Users, text: "Talk to someone if you feel overwhelmed. Asking for help is brave." },
    { icon: Smile, text: "Celebrate small wins, not just the big goals." },
  ],
  pt: [
    { icon: Moon, text: "Durma 7-8 horas: a memória se consolida enquanto você descansa." },
    { icon: Coffee, text: "Faça pausas de 5 min a cada 25 min de estudo (Pomodoro)." },
    { icon: BookOpen, text: "Divida temas grandes em partes pequenas e alcançáveis." },
    { icon: Users, text: "Converse com alguém se se sentir sobrecarregado. Pedir ajuda é corajoso." },
    { icon: Smile, text: "Celebre pequenas vitórias, não apenas as grandes metas." },
  ],
  fr: [
    { icon: Moon, text: "Dormez 7-8 heures : la mémoire se consolide pendant le repos." },
    { icon: Coffee, text: "Faites des pauses de 5 min toutes les 25 min d'étude (Pomodoro)." },
    { icon: BookOpen, text: "Divisez les grands sujets en petites parties réalisables." },
    { icon: Users, text: "Parlez à quelqu'un si vous vous sentez débordé. Demander de l'aide, c'est courageux." },
    { icon: Smile, text: "Célébrez les petites victoires, pas seulement les grands objectifs." },
  ],
};

export function Wellbeing() {
  const { t, locale } = useApp();

  // --- Respiración ---
  const [tech, setTech] = useState<keyof typeof TECHNIQUES>("478");
  const [active, setActive] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycles, setCycles] = useState(0);
  const phases: { key: Phase; duration: number }[] = [
    { key: "in", duration: TECHNIQUES[tech].in },
    { key: "hold", duration: TECHNIQUES[tech].hold },
    { key: "out", duration: TECHNIQUES[tech].out },
  ];

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      setPhaseIdx((i) => {
        const next = (i + 1) % phases.length;
        if (next === 0) setCycles((c) => c + 1);
        return next;
      });
    }, phases[phaseIdx].duration * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, phaseIdx, tech]);

  const phase = phases[phaseIdx];
  const phaseLabel =
    phase.key === "in" ? t.wellbeing.breatheIn : phase.key === "hold" ? t.wellbeing.breatheHold : t.wellbeing.breatheOut;
  const scale = phase.key === "in" ? 1.4 : phase.key === "hold" ? 1.4 : 0.8;

  // --- Sonidos ambientales ---
  const soundRef = useRef<AmbientSound | null>(null);
  const [sound, setSound] = useState<SoundType>("off");
  useEffect(() => {
    if (!soundRef.current) soundRef.current = new AmbientSound();
    soundRef.current.play(sound);
    return () => {
      /* se limpia al cambiar */
    };
  }, [sound]);
  useEffect(() => {
    return () => soundRef.current?.stop();
  }, []);

  const sounds: { type: SoundType; icon: typeof CloudRain; label: string }[] = [
    { type: "rain", icon: CloudRain, label: t.wellbeing.soundRain },
    { type: "forest", icon: Trees, label: t.wellbeing.soundForest },
    { type: "waves", icon: Waves, label: t.wellbeing.soundWaves },
    { type: "cafe", icon: CupSoda, label: t.wellbeing.soundCafe },
    { type: "off", icon: VolumeX, label: t.wellbeing.soundOff },
  ];

  // --- Estado de ánimo ---
  const [mood, setMood] = useState<string | null>(null);
  const moods = [
    { emoji: "😣", label: t.wellbeing.moodStressed },
    { emoji: "😴", label: t.wellbeing.moodTired },
    { emoji: "🙂", label: t.wellbeing.moodOk },
    { emoji: "💪", label: t.wellbeing.moodMotivated },
    { emoji: "🤩", label: t.wellbeing.moodGreat },
  ];

  // --- Frase motivadora con IA ---
  const [quote, setQuote] = useState("");
  const [loadingQuote, setLoadingQuote] = useState(false);

  async function fetchQuote(moodLabel?: string) {
    setLoadingQuote(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, mood: moodLabel }),
      });
      const data = await res.json();
      setQuote(data.quote || "✨");
    } catch {
      setQuote("✨");
    } finally {
      setLoadingQuote(false);
    }
  }

  useEffect(() => {
    fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tips = TIPS[locale] ?? TIPS.es;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={HeartPulse} title={t.wellbeing.title} subtitle={t.wellbeing.subtitle} />

      {/* Frase del día (IA) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glow-border mt-6 rounded-3xl p-6"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-accent">
            <Quote className="h-4 w-4" />
            {t.wellbeing.quoteTitle}
          </span>
          <button
            onClick={() => fetchQuote(mood ?? undefined)}
            disabled={loadingQuote}
            className="flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loadingQuote && "animate-spin")} />
            {t.wellbeing.newQuote}
          </button>
        </div>
        {loadingQuote && !quote ? (
          <p className="flex items-center gap-2 text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> {t.wellbeing.quoteLoading}
          </p>
        ) : (
          <p className="text-lg font-medium leading-relaxed text-foreground">“{quote}”</p>
        )}
      </motion.div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* Respiración */}
        <div className="glass flex flex-col items-center rounded-3xl p-8">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Wind className="h-5 w-5 text-accent" />
            {t.wellbeing.breathe}
          </h3>

          {/* Selector de técnica */}
          <div className="mb-5 flex flex-wrap justify-center gap-1.5">
            {([
              { k: "478", label: t.wellbeing.tech478 },
              { k: "box", label: t.wellbeing.techBox },
              { k: "calm", label: t.wellbeing.techCalm },
            ] as const).map((o) => (
              <button
                key={o.k}
                onClick={() => {
                  setTech(o.k);
                  setActive(false);
                  setPhaseIdx(0);
                  setCycles(0);
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                  tech === o.k ? "bg-brand/20 text-brand" : "text-muted hover:text-foreground"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="relative flex h-48 w-48 items-center justify-center">
            <motion.div
              className="absolute h-36 w-36 rounded-full bg-gradient-to-br from-brand/40 to-accent/40 blur-xl"
              animate={active ? { scale } : { scale: 1 }}
              transition={{ duration: active ? phase.duration : 0.5, ease: "easeInOut" }}
            />
            <motion.div
              className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent"
              animate={active ? { scale } : { scale: 1 }}
              transition={{ duration: active ? phase.duration : 0.5, ease: "easeInOut" }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={active ? phase.key : "idle"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center font-semibold text-white"
                >
                  {active ? phaseLabel : "🧘"}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </div>

          {active && (
            <p className="mt-3 text-xs text-muted">
              {t.wellbeing.cycle} {cycles}
            </p>
          )}

          <button
            onClick={() => {
              setActive((a) => !a);
              setPhaseIdx(0);
              setCycles(0);
            }}
            className="mt-4 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            {active ? t.wellbeing.stopBreathing : t.wellbeing.startBreathing}
          </button>
        </div>

        {/* Columna derecha: ánimo + sonidos */}
        <div className="space-y-5">
          {/* Estado de ánimo */}
          <div className="glass rounded-3xl p-6">
            <h3 className="mb-4 font-semibold">{t.wellbeing.moodTitle}</h3>
            <div className="flex justify-between gap-2">
              {moods.map((m) => (
                <button
                  key={m.label}
                  onClick={() => {
                    setMood(m.label);
                    fetchQuote(m.label);
                  }}
                  title={m.label}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition",
                    mood === m.label ? "bg-brand/20 ring-1 ring-brand/40" : "hover:bg-white/5"
                  )}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] text-muted">{m.label}</span>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {mood && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 text-center text-xs text-accent"
                >
                  {t.wellbeing.moodThanks}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Sonidos ambientales */}
          <div className="glass rounded-3xl p-6">
            <h3 className="mb-4 font-semibold">{t.wellbeing.soundsTitle}</h3>
            <div className="grid grid-cols-5 gap-2">
              {sounds.map((s) => {
                const Icon = s.icon;
                const activeSound = sound === s.type;
                return (
                  <button
                    key={s.type}
                    onClick={() => setSound(s.type)}
                    title={s.label}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl py-2.5 transition",
                      activeSound ? "bg-accent/20 text-accent ring-1 ring-accent/40" : "text-muted hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[9px] leading-tight">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="glass mt-5 rounded-3xl p-6">
        <h3 className="mb-4 font-semibold">{t.wellbeing.tipsTitle}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {tips.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand/30 to-accent/30">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">{tip.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
