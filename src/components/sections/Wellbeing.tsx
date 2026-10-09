"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, Wind, Moon, Coffee, Users, BookOpen, Smile } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";

type Phase = "in" | "hold" | "out";
const PHASES: { key: Phase; duration: number }[] = [
  { key: "in", duration: 4 },
  { key: "hold", duration: 4 },
  { key: "out", duration: 6 },
];

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
  const [active, setActive] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    if (!active) return;
    const phase = PHASES[phaseIdx];
    const timer = setTimeout(() => {
      setPhaseIdx((i) => (i + 1) % PHASES.length);
    }, phase.duration * 1000);
    return () => clearTimeout(timer);
  }, [active, phaseIdx]);

  const phase = PHASES[phaseIdx];
  const phaseLabel =
    phase.key === "in" ? t.wellbeing.breatheIn : phase.key === "hold" ? t.wellbeing.breatheHold : t.wellbeing.breatheOut;
  const scale = phase.key === "in" ? 1.4 : phase.key === "hold" ? 1.4 : 0.8;
  const tips = TIPS[locale] ?? TIPS.es;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 lg:pb-8">
      <SectionHeader icon={HeartPulse} title={t.wellbeing.title} subtitle={t.wellbeing.subtitle} />

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* Respiración */}
        <div className="glass flex flex-col items-center rounded-3xl p-8">
          <h3 className="mb-6 flex items-center gap-2 font-semibold">
            <Wind className="h-5 w-5 text-accent" />
            {t.wellbeing.breathe}
          </h3>

          <div className="relative flex h-56 w-56 items-center justify-center">
            <motion.div
              className="absolute h-40 w-40 rounded-full bg-gradient-to-br from-brand/40 to-accent/40 blur-xl"
              animate={active ? { scale } : { scale: 1 }}
              transition={{ duration: active ? phase.duration : 0.5, ease: "easeInOut" }}
            />
            <motion.div
              className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent"
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

          <button
            onClick={() => {
              setActive((a) => !a);
              setPhaseIdx(0);
            }}
            className="mt-6 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            {active ? t.wellbeing.stopBreathing : t.wellbeing.startBreathing}
          </button>
        </div>

        {/* Tips */}
        <div className="glass rounded-3xl p-6">
          <h3 className="mb-4 font-semibold">{t.wellbeing.tipsTitle}</h3>
          <div className="space-y-3">
            {tips.map((tip, i) => {
              const Icon = tip.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand/30 to-accent/30">
                    <Icon className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">{tip.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
