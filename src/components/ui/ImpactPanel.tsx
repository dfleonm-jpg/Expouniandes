"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Timer, ListChecks, MessageSquare, FileText } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { getGlobalMetrics, type GlobalMetrics } from "@/lib/metrics-store";

/** Panel de impacto global: muestra acumulados de toda la comunidad (Firebase). */
export function ImpactPanel() {
  const { t } = useApp();
  const [m, setM] = useState<GlobalMetrics | null>(null);

  useEffect(() => {
    let active = true;
    getGlobalMetrics().then((data) => {
      if (active) setM(data);
    });
    return () => {
      active = false;
    };
  }, []);

  // No mostrar si no hay datos (o Firebase apagado).
  if (!m) return null;
  const total = m.focusMinutes + m.quizzes + m.questions + m.summaries + m.flashcards;
  if (total === 0) return null;

  const cards = [
    { icon: Timer, value: m.focusMinutes, label: t.ui.impactMinutes, color: "from-emerald-500 to-teal-500" },
    { icon: ListChecks, value: m.quizzes, label: t.ui.impactQuizzes, color: "from-cyan-500 to-blue-500" },
    { icon: MessageSquare, value: m.questions, label: t.ui.impactQuestions, color: "from-violet-500 to-indigo-500" },
    { icon: FileText, value: m.summaries, label: t.ui.impactSummaries, color: "from-fuchsia-500 to-purple-500" },
  ];

  return (
    <div className="mt-20">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-calm">
          <TrendingUp className="h-4 w-4" />
          {t.ui.impactTitle}
        </span>
        <p className="mx-auto mt-2 max-w-xl text-muted">{t.ui.impactSubtitle}</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-3xl p-6 text-center"
            >
              <div className={`mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-3xl font-extrabold tabular-nums text-gradient">{c.value.toLocaleString()}</p>
              <p className="mt-1 text-sm text-muted">{c.label}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
