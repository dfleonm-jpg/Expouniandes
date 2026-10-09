"use client";

import { motion } from "framer-motion";
import { BarChart3, ListChecks, MessageSquare, Timer, CheckCircle2, Layers, FileText, Flame } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";

export function Progress() {
  const { t, stats, streak } = useApp();

  const cards = [
    { icon: ListChecks, label: t.progress.quizzesTaken, value: stats.quizzesTaken, color: "from-cyan-500 to-blue-500" },
    { icon: MessageSquare, label: t.progress.questionsAnswered, value: stats.questionsAnswered, color: "from-violet-500 to-indigo-500" },
    { icon: Timer, label: t.progress.focusMinutes, value: stats.focusMinutes, color: "from-emerald-500 to-teal-500" },
    { icon: CheckCircle2, label: t.progress.tasksDone, value: stats.tasksDone, color: "from-rose-500 to-pink-500" },
    { icon: Layers, label: t.nav.flashcards, value: stats.flashcardsReviewed, color: "from-amber-500 to-orange-500" },
    { icon: FileText, label: t.nav.summary, value: stats.summariesCreated, color: "from-fuchsia-500 to-purple-500" },
  ];

  const totalActivity = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={BarChart3} title={t.progress.title} subtitle={t.progress.subtitle} />

      {/* Racha destacada */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glow-border mt-6 flex items-center gap-4 rounded-3xl p-6"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-warn to-danger">
          <Flame className="h-8 w-8 text-white" />
        </div>
        <div>
          <p className="text-3xl font-extrabold tabular-nums">{streak}</p>
          <p className="text-sm text-muted">
            {streak === 1 ? t.ui.day : t.ui.days} {t.ui.streakLabel} 🔥
          </p>
        </div>
      </motion.div>

      {totalActivity === 0 ? (
        <div className="glass mt-5 rounded-3xl p-16 text-center text-muted">{t.progress.noData}</div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass relative overflow-hidden rounded-3xl p-6"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-4xl font-extrabold tabular-nums">{card.value}</p>
                <p className="mt-1 text-sm text-muted">{card.label}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
