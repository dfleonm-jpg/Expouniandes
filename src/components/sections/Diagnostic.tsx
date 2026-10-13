"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Loader2, TrendingUp, TrendingDown, Sparkles, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import { RichText } from "../ui/RichText";
import { cn } from "@/lib/utils";
import type { DiagnosticQuestion } from "@/lib/types";

type Phase = "intro" | "loading" | "quiz" | "results";

const AREA_OPTIONS = ["Programación", "Cálculo", "Física", "Álgebra"];

export function Diagnostic() {
  const { t, locale, trackMastery } = useApp();
  const quizReq = useAIRequest<{ questions: DiagnosticQuestion[] }>();
  const planReq = useAIRequest<{ plan: string }>();

  const [phase, setPhase] = useState<Phase>("intro");
  const [areas, setAreas] = useState<string[]>(["Programación", "Cálculo"]);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  function toggleArea(a: string) {
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function start() {
    setPhase("loading");
    const res = await quizReq.run("/api/diagnostic", { mode: "quiz", areas, locale });
    if (res?.questions?.length) {
      setQuestions(res.questions);
      setAnswers(new Array(res.questions.length).fill(-1));
      setCurrent(0);
      setPhase("quiz");
    } else {
      setPhase("intro");
    }
  }

  function answer(i: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = i;
      return next;
    });
  }

  async function finish() {
    // Calcula desempeño por área.
    const byArea: Record<string, { ok: number; total: number }> = {};
    questions.forEach((q, i) => {
      const a = (byArea[q.area] ??= { ok: 0, total: 0 });
      a.total++;
      if (answers[i] === q.correctIndex) a.ok++;
    });
    const strong: string[] = [];
    const weak: string[] = [];
    Object.entries(byArea).forEach(([area, s]) => {
      if (s.ok / s.total >= 0.6) strong.push(area);
      else weak.push(area);
    });
    // Alimenta el perfil de dominio adaptativo con el desempeño por área.
    trackMastery(
      Object.entries(byArea).map(([area, s]) => ({ label: area, performance: (s.ok / Math.max(s.total, 1)) * 100 }))
    );
    setPhase("results");
    planReq.run("/api/diagnostic", { mode: "plan", weakAreas: weak, strongAreas: strong, locale });
  }

  // Resultados por área (para pintar).
  const perArea = (() => {
    const byArea: Record<string, { ok: number; total: number }> = {};
    questions.forEach((q, i) => {
      const a = (byArea[q.area] ??= { ok: 0, total: 0 });
      a.total++;
      if (answers[i] === q.correctIndex) a.ok++;
    });
    return byArea;
  })();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-nav">
      <SectionHeader icon={Compass} title={t.diagnostic.title} subtitle={t.diagnostic.subtitle} />

      <div className="mt-6">
        {quizReq.error && <ErrorBanner message={quizReq.error} onRetry={start} onDismiss={() => quizReq.setError(null)} />}

        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-3xl p-6 sm:p-8">
              <p className="text-muted">{t.diagnostic.intro}</p>
              <label className="mb-2 mt-5 block text-sm font-medium text-foreground/80">{t.diagnostic.areasLabel}</label>
              <div className="flex flex-wrap gap-2">
                {AREA_OPTIONS.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleArea(a)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      areas.includes(a) ? "bg-gradient-to-r from-brand to-accent text-white" : "glass text-muted hover:text-foreground"
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <button
                onClick={start}
                disabled={areas.length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                <Sparkles className="h-5 w-5" />
                {t.diagnostic.start}
              </button>
            </motion.div>
          )}

          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass flex flex-col items-center rounded-3xl p-16 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-brand" />
              <p className="mt-4 text-muted">{t.diagnostic.generating}</p>
            </motion.div>
          )}

          {phase === "quiz" && questions[current] && (
            <motion.div key={`q${current}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="glass rounded-3xl p-6 sm:p-8">
              <div className="mb-4 flex items-center justify-between text-sm text-muted">
                <span>{t.diagnostic.question} {current + 1}/{questions.length}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{questions[current].area}</span>
              </div>
              <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-brand to-accent" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
              </div>
              <RichText className="prose-sereno text-lg font-semibold">{questions[current].question}</RichText>
              <div className="mt-5 space-y-3">
                {questions[current].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                      answers[current] === i ? "border-brand/60 bg-brand/15" : "glass border-transparent hover:bg-white/10"
                    )}
                  >
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", answers[current] === i ? "bg-brand text-white" : "bg-white/10")}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <RichText className="prose-sereno [&_p]:m-0">{opt}</RichText>
                  </button>
                ))}
              </div>
              <button
                onClick={() => (current < questions.length - 1 ? setCurrent((c) => c + 1) : finish())}
                disabled={answers[current] === -1}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {current < questions.length - 1 ? t.diagnostic.question : t.diagnostic.finish}
              </button>
            </motion.div>
          )}

          {phase === "results" && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <h2 className="text-xl font-bold">{t.diagnostic.resultsTitle}</h2>

              {/* Niveles por área */}
              <div className="space-y-2">
                {Object.entries(perArea).map(([area, s]) => {
                  const pct = Math.round((s.ok / s.total) * 100);
                  const good = pct >= 60;
                  return (
                    <div key={area} className="glass rounded-2xl p-4">
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          {good ? <TrendingUp className="h-4 w-4 text-calm" /> : <TrendingDown className="h-4 w-4 text-warn" />}
                          {area}
                        </span>
                        <span className={good ? "text-calm" : "text-warn"}>{s.ok}/{s.total} · {pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className={cn("h-full rounded-full", good ? "bg-calm" : "bg-warn")}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Plan personalizado */}
              <div className="glass glow-border rounded-2xl p-5">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent">
                  <Sparkles className="h-4 w-4" />
                  {t.diagnostic.planTitle}
                </p>
                {planReq.loading ? (
                  <p className="flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" /> {t.diagnostic.planLoading}</p>
                ) : planReq.data ? (
                  <RichText>{planReq.data.plan}</RichText>
                ) : null}
              </div>

              <button
                onClick={() => {
                  quizReq.reset();
                  planReq.reset();
                  setPhase("intro");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-6 py-3 text-sm font-medium transition hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4" />
                {t.diagnostic.retake}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
