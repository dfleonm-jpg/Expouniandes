"use client";

import { motion } from "framer-motion";
import { BarChart3, ListChecks, MessageSquare, Timer, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";

export function Progress() {
  const { t, stats } = useApp();

  const cards = [
    { icon: ListChecks, label: t.progress.quizzesTaken, value: stats.quizzesTaken, color: "from-cyan-500 to-blue-500" },
    { icon: MessageSquare, label: t.progress.questionsAnswered, value: stats.questionsAnswered, color: "from-violet-500 to-indigo-500" },
    { icon: Timer, label: t.progress.focusMinutes, value: stats.focusMinutes, color: "from-emerald-500 to-teal-500" },
    { icon: CheckCircle2, label: t.progress.tasksDone, value: stats.tasksDone, color: "from-rose-500 to-pink-500" },
  ];

  const totalActivity = stats.quizzesTaken + stats.questionsAnswered + stats.focusMinutes + stats.tasksDone;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 lg:pb-8">
      <SectionHeader icon={BarChart3} title={t.progress.title} subtitle={t.progress.subtitle} />

      {totalActivity === 0 ? (
        <div className="glass mt-8 rounded-3xl p-16 text-center text-muted">{t.progress.noData}</div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass relative overflow-hidden rounded-3xl p-6"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 + 0.2 }}
                  className="text-4xl font-extrabold tabular-nums"
                >
                  {card.value}
                </motion.p>
                <p className="mt-1 text-sm text-muted">{card.label}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
