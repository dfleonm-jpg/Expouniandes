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
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Gauge,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import { computeXP, levelInfo } from "@/lib/levels";
import { sortedTopics, overallMastery } from "@/lib/mastery";
import { cn } from "@/lib/utils";
import type { ExamAnalysis } from "@/lib/types";

export function Progress() {
  const { t, locale, stats, streak, examHistory, mastery } = useApp();
  const lvl = levelInfo(computeXP(stats));
  const analysis = useAIRequest<ExamAnalysis>();
  const masteryTopics = sortedTopics(mastery);
  const overall = overallMastery(mastery);

  function analyzeExams() {
    analysis.run("/api/exam-analysis", {
      records: examHistory.map((e) => ({ topic: e.topic, score: e.score, total: e.total, date: e.date })),
      locale,
    });
  }

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

      {/* Nivel + XP */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glow-border mt-6 rounded-3xl p-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent">
            <span className="text-2xl font-extrabold text-white">{lvl.level}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <p className="font-bold">
                {t.ui.level} {lvl.level}
              </p>
              <p className="text-xs text-muted">
                {lvl.xp} {t.ui.xp}
              </p>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${lvl.progress * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {lvl.toNext} {t.ui.xp} {t.ui.toNextLevel}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Racha destacada */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass mt-5 flex items-center gap-4 rounded-3xl p-6"
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

      {/* Perfil de dominio adaptativo (fortalezas y debilidades) */}
      {masteryTopics.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass mt-5 rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Gauge className="h-5 w-5 text-brand" />
              {t.ui.masteryTitle}
            </h2>
            {overall !== null && (
              <div className="text-right">
                <p className="text-2xl font-extrabold tabular-nums text-gradient">{overall}%</p>
                <p className="text-[10px] uppercase tracking-wide text-muted">{t.ui.masteryOverall}</p>
              </div>
            )}
          </div>
          <p className="mb-4 text-xs text-muted">{t.ui.masteryDesc}</p>
          <div className="space-y-3">
            {masteryTopics.map((m) => (
              <div key={m.topic}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{m.label}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", levelBadge(m.score))}>
                      {t.ui.masteryLevels[m.level]}
                    </span>
                    <span className="w-9 text-right tabular-nums text-muted">{m.score}%</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className={cn("h-full rounded-full", barColor(m.score))}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.score}%` }}
                    transition={{ duration: 0.7 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

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

            {/* Análisis de errores con IA */}
            {examHistory.length >= 2 && (
              <div className="glass mb-3 rounded-2xl p-4">
                {!analysis.data && !analysis.loading && (
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <div>
                        <p className="text-sm font-semibold">{t.ui.analyzeTitle}</p>
                        <p className="text-xs text-muted">{t.ui.analyzeDesc}</p>
                      </div>
                    </div>
                    <button
                      onClick={analyzeExams}
                      className="shine shrink-0 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      {t.ui.analyzeBtn}
                    </button>
                  </div>
                )}
                {analysis.loading && (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-brand" />
                    {t.ui.analyzing}
                  </div>
                )}
                {analysis.error && <ErrorBanner message={analysis.error} onRetry={analyzeExams} />}
                {analysis.data && <ExamAnalysisPanel data={analysis.data} t={t} onRefresh={analyzeExams} />}
              </div>
            )}

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

/** Panel con el análisis de errores de parciales generado por IA. */
function ExamAnalysisPanel({
  data,
  t,
  onRefresh,
}: {
  data: ExamAnalysis;
  t: ReturnType<typeof useApp>["t"];
  onRefresh: () => void;
}) {
  const TrendIcon = data.trend === "mejorando" ? TrendingUp : data.trend === "bajando" ? TrendingDown : Minus;
  const trendColor =
    data.trend === "mejorando" ? "text-calm" : data.trend === "bajando" ? "text-danger" : "text-muted";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-start gap-2 text-sm text-foreground/90">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          {data.overview}
        </p>
        <button onClick={onRefresh} className="shrink-0 text-xs text-muted transition hover:text-foreground">
          {t.ui.analyzeBtn}
        </button>
      </div>

      {/* Tendencia */}
      <div className={cn("inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium", trendColor)}>
        <TrendIcon className="h-3.5 w-3.5" />
        {t.ui.trend}: {data.trend}
      </div>

      {/* Temas débiles */}
      {data.weakTopics?.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <AlertTriangle className="h-3.5 w-3.5 text-warn" />
            {t.ui.weakTopics}
          </p>
          <div className="space-y-2">
            {data.weakTopics.map((w, i) => (
              <div key={i} className="rounded-xl bg-white/[0.03] p-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{w.topic}</span>
                  <span className={cn("text-xs font-bold tabular-nums", w.accuracy >= 60 ? "text-calm" : "text-danger")}>
                    {Math.round(w.accuracy)}%
                  </span>
                </div>
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn("h-full rounded-full", w.accuracy >= 60 ? "bg-calm" : "bg-danger")}
                    style={{ width: `${Math.min(Math.max(w.accuracy, 0), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted">{w.advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Temas fuertes */}
      {data.strongTopics?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">{t.ui.strongTopics}:</span>
          {data.strongTopics.map((s, i) => (
            <span key={i} className="rounded-full bg-calm/15 px-2.5 py-0.5 text-xs text-calm">{s}</span>
          ))}
        </div>
      )}

      {/* Patrones */}
      {data.patterns?.length > 0 && (
        <ul className="space-y-1 text-sm text-foreground/85">
          {data.patterns.map((p, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
              {p}
            </li>
          ))}
        </ul>
      )}

      {/* Próximos pasos */}
      {data.nextSteps?.length > 0 && (
        <div className="rounded-xl bg-brand/10 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand">{t.ui.nextSteps}</p>
          <ol className="space-y-1.5">
            {data.nextSteps.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/30 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
    </motion.div>
  );
}

/** Color de la barra de dominio según el nivel. */
function barColor(score: number): string {
  if (score >= 85) return "bg-gradient-to-r from-calm to-emerald-400";
  if (score >= 65) return "bg-gradient-to-r from-brand to-accent";
  if (score >= 40) return "bg-gradient-to-r from-warn to-amber-400";
  return "bg-gradient-to-r from-danger to-rose-400";
}
/** Estilo de la insignia de nivel de dominio. */
function levelBadge(score: number): string {
  if (score >= 85) return "bg-calm/20 text-calm";
  if (score >= 65) return "bg-brand/20 text-brand";
  if (score >= 40) return "bg-warn/20 text-warn";
  return "bg-danger/20 text-danger";
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
            <stop offset="0%" stopColor="#3b6fe5" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
