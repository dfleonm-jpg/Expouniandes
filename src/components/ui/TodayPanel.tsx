"use client";

import { motion } from "framer-motion";
import { Target, ArrowRight, Flame, Compass } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { subjectBreakdown } from "@/lib/mastery";
import type { Section } from "../Sidebar";

/**
 * Panel "Qué estudiar hoy": recomendación inteligente de la próxima acción,
 * priorizando (1) parcial más cercano, (2) materia/tema más débil. Local e
 * instantáneo (usa el dominio por materia y el calendario).
 */
export function TodayPanel({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const { t, mastery, examEvents } = useApp();
  const today = new Date().toISOString().slice(0, 10);

  const subjects = subjectBreakdown(mastery);
  const upcoming = examEvents
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Sin datos aún: invita al diagnóstico.
  if (subjects.length === 0 && upcoming.length === 0) {
    const r = t.today.emptyRec;
    return (
      <Shell icon={Compass} tag={t.today.tag} title={t.today.emptyTitle}>
        <Recommendation
          text={r}
          cta={t.nav.diagnostic}
          onClick={() => onNavigate("diagnostic")}
        />
      </Shell>
    );
  }

  // Prioridad 1: parcial dentro de 7 días → recomienda plan/práctica.
  const soonExam = upcoming.find((e) => {
    const d = Math.round((new Date(e.date + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 864e5);
    return d <= 7;
  });

  // Prioridad 2: la materia más débil.
  const weakest = subjects[0];

  let text: string;
  let cta: string;
  let target: Section;

  if (soonExam) {
    const d = Math.round((new Date(soonExam.date + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 864e5);
    text = t.today.recExam.replace("{s}", soonExam.subject).replace("{d}", String(d));
    cta = t.today.ctaPlan;
    target = "planner";
  } else if (weakest && weakest.score < 65) {
    const topic = weakest.topics[0];
    text = t.today.recWeak.replace("{s}", weakest.subject).replace("{t}", topic?.label ?? weakest.subject).replace("{n}", String(weakest.score));
    cta = t.today.ctaPractice;
    // Elige la herramienta según la materia.
    const key = weakest.subjectKey;
    target = /program|python|codig|code/.test(key) ? "codePractice" : /calcul|fisic|math|algebra/.test(key) ? "mathPractice" : "quiz";
  } else {
    text = t.today.recStrong.replace("{s}", weakest?.subject ?? "");
    cta = t.today.ctaExam;
    target = "openExam";
  }

  return (
    <Shell icon={Target} tag={t.today.tag} title={t.today.title}>
      <Recommendation text={text} cta={cta} onClick={() => onNavigate(target)} />
      {/* Mini resumen de materias débiles */}
      {subjects.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {subjects.slice(0, 3).map((s) => (
            <span
              key={s.subjectKey}
              className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs"
            >
              <span className={s.score < 50 ? "text-danger" : s.score < 70 ? "text-warn" : "text-calm"}>●</span>
              {s.subject} · {s.score}%
            </span>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({
  icon: Icon,
  tag,
  title,
  children,
}: {
  icon: typeof Target;
  tag: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glow-border mt-10 overflow-hidden rounded-3xl p-6 text-left"
    >
      <div className="pointer-events-none absolute" />
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent glow-ring">
          <Icon className="h-5 w-5 text-white" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">{tag}</p>
          <h3 className="text-lg font-bold leading-tight">{title}</h3>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function Recommendation({ text, cta, onClick }: { text: string; cta: string; onClick: () => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-sm text-foreground/85">
        <Flame className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
        {text}
      </p>
      <button
        onClick={onClick}
        className="shine group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {cta}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </button>
    </div>
  );
}
