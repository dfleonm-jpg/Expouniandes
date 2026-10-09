"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  ListChecks,
  MessageSquare,
  Timer,
  CheckCircle2,
  Layers,
  FileText,
  Flame,
  Award,
  GraduationCap,
  Lock,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";
import { cn } from "@/lib/utils";

export function Progress() {
  const { t, stats, streak, examHistory } = useApp();

  const cards = [
    { icon: ListChecks, label: t.progress.quizzesTaken, value: stats.quizzesTaken, color: "from-cyan-500 to-blue-500" },
    { icon: MessageSquare, label: t.progress.questionsAnswered, value: stats.questionsAnswered, color: "from-violet-500 to-indigo-500" },
    { icon: Timer, label: t.progress.focusMinutes, value: stats.focusMinutes, color: "from-emerald-500 to-teal-500" },
    { icon: CheckCircle2, label: t.progress.tasksDone, value: stats.tasksDone, color: "from-rose-500 to-pink-500" },
    { icon: Layers, label: t.nav.flashcards, value: stats.flashcardsReviewed, color: "from-amber-500 to-orange-500" },
    { icon: FileText, label: t.nav.summary, value: stats.summariesCreated, color: "from-fuchsia-500 to-purple-500" },
  ];

  const totalActivity = Object.values(stats).reduce((a, b) => a + b, 0);

  // Logros desbloqueables
  const badges = [
    { emoji: "🚀", label: "Primer paso", unlocked: totalActivity > 0 },
    { emoji: "💬", label: "Curioso", unlocked: stats.questionsAnswered >= 10 },
    { emoji: "📝", label: "Examinado", unlocked: stats.quizzesTaken >= 1 },
    { emoji: "🔥", label: "Constante", unlocked: streak >= 3 },
    { emoji: "⏱️", label: "Enfocado", unlocked: stats.focusMinutes >= 25 },
    { emoji: "🧠", label: "Erudito", unlocked: stats.questionsAnswered >= 50 },
    { emoji: "🏆", label: "Maestro", unlocked: examHistory.some((e) => e.score / e.total >= 0.9) },
  ];

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

      {/* Logros */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Award className="h-5 w-5 text-warn" />
          {t.ui.achievements}
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {badges.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "glass flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center",
                !b.unlocked && "opacity-40 grayscale"
              )}
            >
              <span className="text-2xl">{b.unlocked ? b.emoji : <Lock className="h-6 w-6 text-muted" />}</span>
              <span className="text-[10px] font-medium leading-tight text-muted">{b.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Historial de parciales */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <GraduationCap className="h-5 w-5 text-brand" />
          {t.ui.examHistory}
        </h2>
        {examHistory.length === 0 ? (
          <p className="glass rounded-2xl p-6 text-center text-sm text-muted">{t.ui.noExams}</p>
        ) : (
          <div className="space-y-2">
            {examHistory.length >= 2 && <GradeChart history={examHistory} label={t.ui.evolution} />}
            {examHistory.slice(0, 10).map((e, i) => {
              const pct = Math.round((e.score / e.total) * 100);
              const grade = Math.round((e.score / e.total) * 10 * 10) / 10;
              const good = pct >= 60;
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass flex items-center gap-3 rounded-xl p-3"
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                      good ? "bg-calm/20 text-calm" : "bg-danger/20 text-danger"
                    )}
                  >
                    {grade}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.topic}</p>
                    <p className="text-xs text-muted">
                      {e.score}/{e.total} · {new Date(e.date).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Mini-gráfica de líneas (SVG) con la evolución de las notas (más antigua → más reciente). */
function GradeChart({
  history,
  label,
}: {
  history: { score: number; total: number }[];
  label: string;
}) {
  const data = [...history].reverse().map((e) => (e.score / e.total) * 10); // 0..10, cronológico
  const w = 100;
  const h = 42;
  const max = 10;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");

  return (
    <div className="glass mb-3 rounded-2xl p-4">
      <p className="mb-3 text-xs font-medium text-muted">{label}</p>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-24 w-full">
        {/* línea de aprobado (6/10) */}
        <line x1="0" y1={h - (6 / max) * h} x2={w} y2={h - (6 / max) * h} stroke="rgba(52,211,153,0.3)" strokeWidth="0.5" strokeDasharray="2 2" />
        <polyline
          points={points}
          fill="none"
          stroke="url(#g)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((v, i) => (
          <circle key={i} cx={i * step} cy={h - (v / max) * h} r="1.4" fill={v >= 6 ? "#34d399" : "#fb7185"} vectorEffect="non-scaling-stroke" />
        ))}
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
