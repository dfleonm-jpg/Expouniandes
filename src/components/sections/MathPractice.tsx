"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sigma, Sparkles, Loader2, Check, X, RotateCcw, Wand2, Info } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import { RichText } from "../ui/RichText";
import { cn } from "@/lib/utils";
import type { MathProblem, MathReview } from "@/lib/types";

export function MathPractice() {
  const { t, locale, addStat } = useApp();
  const probReq = useAIRequest<MathProblem>();
  const revReq = useAIRequest<MathReview>();

  const [topic, setTopic] = useState(t.mathPractice.topics[0]);
  const [difficulty, setDifficulty] = useState("media");
  const [work, setWork] = useState("");

  async function newProblem(tp?: string) {
    revReq.reset();
    setWork("");
    await probReq.run("/api/math-problem", { topic: tp ?? topic, difficulty, locale });
  }

  async function check() {
    if (!work.trim() || !probReq.data) return;
    const res = await revReq.run("/api/math-review", {
      problem: probReq.data.problem,
      answer: probReq.data.answer,
      work,
      locale,
    });
    if (res) addStat("questionsAnswered", 1);
  }

  const prob = probReq.data;
  const rev = revReq.data;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={Sigma} title={t.mathPractice.title} subtitle={t.mathPractice.subtitle} />

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-xs text-foreground/80 ring-1 ring-accent/20">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p>{t.mathPractice.integrity}</p>
      </div>

      <div className="mt-5 space-y-4">
        {probReq.error && <ErrorBanner message={probReq.error} onRetry={() => newProblem()} onDismiss={() => probReq.setError(null)} />}

        {!prob ? (
          <div className="glass rounded-3xl p-6">
            <label className="mb-2 block text-sm font-medium text-foreground/80">{t.mathPractice.topicLabel}</label>
            <div className="flex flex-wrap gap-2">
              {t.mathPractice.topics.map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTopic(tp)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    topic === tp ? "bg-gradient-to-r from-brand to-accent text-white" : "glass text-muted hover:text-foreground"
                  )}
                >
                  {tp}
                </button>
              ))}
            </div>

            <label className="mb-2 mt-4 block text-sm font-medium text-foreground/80">{t.mathPractice.difficulty}</label>
            <div className="flex gap-2">
              {[
                { v: "fácil", l: t.mathPractice.easy },
                { v: "media", l: t.mathPractice.medium },
                { v: "difícil", l: t.mathPractice.hard },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setDifficulty(o.v)}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition",
                    difficulty === o.v ? "bg-gradient-to-r from-brand to-accent text-white" : "glass text-muted hover:text-foreground"
                  )}
                >
                  {o.l}
                </button>
              ))}
            </div>

            <button
              onClick={() => newProblem()}
              disabled={probReq.loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {probReq.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {probReq.loading ? t.mathPractice.generating : t.mathPractice.newProblem}
            </button>
          </div>
        ) : (
          <>
            <div className="glass rounded-3xl p-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-bold text-brand">{prob.title}</h3>
                <button onClick={() => newProblem()} className="flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground">
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t.mathPractice.newProblem}
                </button>
              </div>
              <RichText>{prob.problem}</RichText>
            </div>

            <div className="glass rounded-3xl p-4">
              <label className="mb-2 block text-sm font-medium text-foreground/80">{t.mathPractice.yourWork}</label>
              <textarea
                value={work}
                onChange={(e) => setWork(e.target.value)}
                placeholder={t.mathPractice.workPlaceholder}
                rows={6}
                className="glass w-full resize-y rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>

            {revReq.error && <ErrorBanner message={revReq.error} onRetry={check} onDismiss={() => revReq.setError(null)} />}

            <button
              onClick={check}
              disabled={!work.trim() || revReq.loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {revReq.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {revReq.loading ? t.mathPractice.checking : t.mathPractice.check}
            </button>

            <AnimatePresence>
              {rev && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="glass glow-border rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold", rev.correct ? "bg-calm/20 text-calm" : "bg-danger/20 text-danger")}>
                        {rev.score.toFixed(1)}
                      </div>
                      <div>
                        <p className="flex items-center gap-2 font-semibold">
                          {rev.correct ? <Check className="h-5 w-5 text-calm" /> : <X className="h-5 w-5 text-danger" />}
                          {rev.correct ? t.mathPractice.correct : t.mathPractice.incorrect}
                        </p>
                        <p className="mt-0.5 text-sm text-muted">{rev.summary}</p>
                      </div>
                    </div>
                    {rev.mistakeStep && (
                      <p className="mt-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">
                        <strong>{t.mathPractice.mistakeAt}:</strong> {rev.mistakeStep}
                      </p>
                    )}
                    {rev.feedback && <div className="mt-2 text-sm text-foreground/85"><RichText>{rev.feedback}</RichText></div>}
                  </div>

                  <div className="glass rounded-2xl p-5">
                    <p className="mb-2 text-sm font-semibold text-accent">📝 {t.mathPractice.solutionTitle}</p>
                    <RichText>{rev.solution}</RichText>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
