"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Loader2, Trophy, RotateCcw, Check, X, Sparkles } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import { RichText } from "../ui/RichText";
import { cn } from "@/lib/utils";
import type { OpenExam as OpenExamType, OpenExamResult } from "@/lib/types";

type Phase = "setup" | "exam" | "results";

export function OpenExam() {
  const { t, locale, profile, addStat, addExamRecord, trackMastery } = useApp();
  const examReq = useAIRequest<OpenExamType>();
  const gradeReq = useAIRequest<OpenExamResult>();

  const [phase, setPhase] = useState<Phase>("setup");
  const [subject, setSubject] = useState("");
  const [count, setCount] = useState(4);
  const [difficulty, setDifficulty] = useState<"facil" | "media" | "dificil">("media");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const presets = Array.from(
    new Set([
      ...(profile.subjects ?? []),
      "Redes y subnetting (IP)",
      "Estructuras de datos",
      "Programación (Python)",
      "Cálculo",
      "Física",
    ])
  ).slice(0, 8);

  const exam = examReq.data;
  const result = gradeReq.data;

  async function start() {
    if (!subject.trim()) return;
    gradeReq.reset();
    setAnswers({});
    const res = await examReq.run("/api/open-exam", {
      subject,
      count,
      difficulty,
      locale,
      profile: profile.completed ? profile : undefined,
    });
    if (res?.questions?.length) setPhase("exam");
  }

  async function submit() {
    if (!exam) return;
    const items = exam.questions.map((q) => ({
      id: q.id,
      topic: q.topic,
      prompt: q.prompt,
      expectedAnswer: q.expectedAnswer,
      rubric: q.rubric,
      points: q.points,
      answer: answers[q.id] ?? "",
    }));
    const res = await gradeReq.run("/api/open-exam-grade", { items, locale }, { timeoutMs: 90000 });
    if (res) {
      setPhase("results");
      addStat("quizzesTaken", 1);
      addStat("questionsAnswered", exam.questions.length);
      addExamRecord({
        topic: exam.subject || subject,
        score: Math.round((res.score5 / 5) * exam.questions.length),
        total: exam.questions.length,
      });
      // Alimenta el dominio adaptativo: nota global + temas débiles/fuertes.
      const entries = [{ label: exam.subject || subject, performance: (res.score5 / 5) * 100 }];
      (res.weakTopics ?? []).forEach((wt) => entries.push({ label: wt, performance: 35 }));
      (res.strongTopics ?? []).forEach((st) => entries.push({ label: st, performance: 85 }));
      trackMastery(entries);
    }
  }

  function reset() {
    examReq.reset();
    gradeReq.reset();
    setAnswers({});
    setPhase("setup");
  }

  const answeredCount = exam ? exam.questions.filter((q) => (answers[q.id] ?? "").trim()).length : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={PenLine} title={t.openExam.title} subtitle={t.openExam.subtitle} />

      <AnimatePresence mode="wait">
        {/* ---------- SETUP ---------- */}
        {phase === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 space-y-4">
            {examReq.error && <ErrorBanner message={examReq.error} onRetry={start} onDismiss={() => examReq.setError(null)} />}

            <div className="glass rounded-3xl p-6">
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-xs text-foreground/80 ring-1 ring-accent/20">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p>{t.openExam.intro}</p>
              </div>

              <label className="mb-1.5 block text-sm font-medium text-foreground/80">{t.openExam.subjectLabel}</label>
              <div className="mb-3 flex flex-wrap gap-2">
                {presets.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition",
                      subject === s ? "bg-gradient-to-r from-brand to-brand-2 text-white" : "glass text-muted hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t.openExam.subjectPlaceholder}
                className="glass w-full rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">{t.openExam.difficulty}</label>
                  <div className="glass inline-flex w-full rounded-xl p-0.5">
                    {(["facil", "media", "dificil"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition",
                          difficulty === d ? "bg-gradient-to-r from-brand to-brand-2 text-white" : "text-muted hover:text-foreground"
                        )}
                      >
                        {t.openExam.difficulties[d]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">
                    {t.openExam.questions}: <span className="text-foreground">{count}</span>
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="mt-2.5 w-full accent-[var(--brand)]"
                  />
                </div>
              </div>

              <button
                onClick={start}
                disabled={!subject.trim() || examReq.loading}
                className="shine mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {examReq.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PenLine className="h-5 w-5" />}
                {examReq.loading ? t.openExam.generating : t.openExam.start}
              </button>
            </div>
          </motion.div>
        )}

        {/* ---------- EXAM ---------- */}
        {phase === "exam" && exam && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 space-y-4">
            {gradeReq.error && <ErrorBanner message={gradeReq.error} onRetry={submit} onDismiss={() => gradeReq.setError(null)} />}
            <div className="glass rounded-2xl p-4">
              <p className="font-semibold">{exam.title}</p>
              <p className="text-xs text-muted">
                {answeredCount}/{exam.questions.length} {t.openExam.answered}
              </p>
            </div>

            {exam.questions.map((q, i) => (
              <div key={q.id} className="glass rounded-2xl p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand">{q.topic}</span>
                  <span className="text-xs text-muted">{q.points} pts</span>
                </div>
                <RichText className="prose-sereno mb-3 text-sm font-medium">{`${i + 1}. ${q.prompt}`}</RichText>
                <textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder={t.openExam.answerPlaceholder}
                  rows={q.type === "long" || q.type === "code" ? 5 : 2}
                  className={cn(
                    "glass w-full resize-y rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50",
                    q.type === "code" && "font-mono"
                  )}
                />
              </div>
            ))}

            <div className="flex gap-2">
              <button
                onClick={reset}
                className="glass rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/10"
              >
                {t.openExam.cancel}
              </button>
              <button
                onClick={submit}
                disabled={gradeReq.loading || answeredCount === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {gradeReq.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                {gradeReq.loading ? t.openExam.grading : t.openExam.submit}
              </button>
            </div>
          </motion.div>
        )}

        {/* ---------- RESULTS ---------- */}
        {phase === "results" && result && exam && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 space-y-4">
            <div className="glass glow-border rounded-3xl p-6 text-center">
              <div
                className={cn(
                  "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br",
                  result.score5 >= 3 ? "from-calm to-emerald-500" : "from-warn to-danger"
                )}
              >
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <p className="text-5xl font-extrabold">
                <span className="text-gradient">{result.score5.toFixed(1)}</span>
                <span className="text-muted">/5</span>
              </p>
              <p className="mt-1 text-sm text-muted">
                {result.totalAwarded}/{result.totalMax} pts
              </p>
              <p className="mt-3 text-sm text-foreground/85">{result.overview}</p>
            </div>

            {/* Retroalimentación por pregunta */}
            {exam.questions.map((q, i) => {
              const g = result.grades.find((x) => x.questionId === q.id);
              if (!g) return null;
              return (
                <div key={q.id} className="glass rounded-2xl p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", g.correct ? "bg-calm/20 text-calm" : "bg-danger/20 text-danger")}>
                        {g.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </span>
                      {t.openExam.question} {i + 1}
                    </span>
                    <span className={cn("text-sm font-bold tabular-nums", g.awarded >= g.max * 0.6 ? "text-calm" : "text-danger")}>
                      {g.awarded}/{g.max}
                    </span>
                  </div>
                  <RichText className="prose-sereno mb-2 text-xs text-muted">{q.prompt}</RichText>
                  <p className="mb-2 text-sm text-foreground/85">{g.feedback}</p>
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-medium text-accent">{t.openExam.showSolution}</summary>
                    <RichText className="prose-sereno mt-2 rounded-xl bg-white/[0.03] p-3 text-sm">{g.modelAnswer}</RichText>
                  </details>
                </div>
              );
            })}

            <button
              onClick={reset}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              <RotateCcw className="h-5 w-5" />
              {t.openExam.another}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
