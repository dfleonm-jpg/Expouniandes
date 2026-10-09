"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wand2, Loader2, RotateCcw, Clock3, Lightbulb } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { ErrorBanner } from "../ui/ErrorBanner";
import type { StudyPlan } from "@/lib/types";

export function StudyPlanGenerator() {
  const { t, locale } = useApp();
  const { loading, error, data, run, reset, setError } = useAIRequest<StudyPlan>();
  const [input, setInput] = useState("");

  async function generate() {
    if (!input.trim()) return;
    await run("/api/study-plan", { input, locale });
  }

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Wand2 className="h-5 w-5 text-accent" />
        <h3 className="font-semibold">{t.studyPlan.title}</h3>
      </div>

      {error && (
        <div className="mb-3">
          <ErrorBanner message={error} onRetry={generate} onDismiss={() => setError(null)} />
        </div>
      )}

      {!data ? (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.studyPlan.placeholder}
            rows={3}
            className="glass w-full resize-none rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
          <button
            onClick={generate}
            disabled={!input.trim() || loading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
            {loading ? t.studyPlan.generating : t.studyPlan.generate}
          </button>
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="mb-4 text-sm text-foreground/85">{data.summary}</p>
          <div className="space-y-3">
            {data.days?.map((day, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl bg-white/[0.03] p-4"
              >
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-brand">{day.day}</p>
                  <p className="text-xs text-muted">{day.focus}</p>
                </div>
                <ul className="space-y-1.5">
                  {day.sessions?.map((s, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-foreground/85">
                      <Clock3 className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span className="text-muted">{s.time}</span>
                      <span className="flex-1">{s.task}</span>
                      <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                        {s.durationMin} {t.studyPlan.min}
                      </span>
                    </li>
                  ))}
                </ul>
                {day.tip && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-calm">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {day.tip}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
          <button
            onClick={() => {
              reset();
              setInput("");
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
            {t.studyPlan.new}
          </button>
        </motion.div>
      )}
    </div>
  );
}
