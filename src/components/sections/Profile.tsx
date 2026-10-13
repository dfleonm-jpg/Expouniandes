"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserCircle, Flame, Trophy, ListChecks, MessageSquare, Timer, Layers, FileText, CheckCircle2, Pencil, Share2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "../ui/Toast";
import { getLeaderboard } from "@/lib/leaderboard-store";
import { computeXP, levelInfo } from "@/lib/levels";
import { overallMastery, subjectBreakdown } from "@/lib/mastery";
import { renderProgressCard, downloadDataUrl } from "@/lib/progress-card";
import { SectionHeader } from "../ui/SectionHeader";
import { cn } from "@/lib/utils";

export function Profile() {
  const { t, stats, streak, examHistory, profile, setProfile, mastery } = useApp();
  const { user } = useAuth();
  const { notify } = useToast();
  const [rank, setRank] = useState<number | null>(null);

  const xp = computeXP(stats);
  const lvl = levelInfo(xp);

  async function shareProgressCard() {
    const subjects = subjectBreakdown(mastery);
    // Materia más fuerte para destacar.
    const top = subjects.length ? [...subjects].sort((a, b) => b.score - a.score)[0] : null;
    const dataUrl = renderProgressCard({
      name: user?.name ?? "Estudiante",
      level: lvl.level,
      xp,
      streak,
      overall: overallMastery(mastery),
      topSubject: top ? { subject: top.subject, score: top.score } : null,
      labels: {
        title: t.profile.cardTitle,
        level: t.profile.level,
        xp: t.profile.xp,
        streak: streak === 1 ? t.ui.day : t.ui.days,
        mastery: t.ui.masteryOverall,
        tagline: t.profile.cardTagline,
      },
    });
    if (!dataUrl) return;
    // Intenta compartir nativamente (móvil); si no, descarga la imagen.
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "sereno-progreso.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: "Sereno", text: t.profile.cardTagline });
        return;
      }
    } catch {
      /* cae a descarga */
    }
    downloadDataUrl(dataUrl, "sereno-progreso.png");
    notify("success", t.profile.cardSaved);
  }

  useEffect(() => {
    if (!user) return;
    let active = true;
    getLeaderboard(100).then((list) => {
      if (!active) return;
      const pos = list.findIndex((e) => e.uid === user.uid);
      setRank(pos >= 0 ? pos + 1 : null);
    });
    return () => {
      active = false;
    };
  }, [user, xp]);

  const statCards = [
    { icon: ListChecks, label: t.progress.quizzesTaken, value: stats.quizzesTaken },
    { icon: MessageSquare, label: t.progress.questionsAnswered, value: stats.questionsAnswered },
    { icon: Timer, label: t.progress.focusMinutes, value: stats.focusMinutes },
    { icon: CheckCircle2, label: t.progress.tasksDone, value: stats.tasksDone },
    { icon: Layers, label: t.nav.flashcards, value: stats.flashcardsReviewed },
    { icon: FileText, label: t.nav.summary, value: stats.summariesCreated },
  ];

  const badges = [
    { emoji: "🚀", unlocked: xp > 0 },
    { emoji: "💬", unlocked: stats.questionsAnswered >= 10 },
    { emoji: "📝", unlocked: stats.quizzesTaken >= 1 },
    { emoji: "🔥", unlocked: streak >= 3 },
    { emoji: "⏱️", unlocked: stats.focusMinutes >= 25 },
    { emoji: "🧠", unlocked: stats.questionsAnswered >= 50 },
    { emoji: "🏆", unlocked: examHistory.some((e) => e.score / e.total >= 0.9) },
  ];

  const name = user?.name ?? "Estudiante";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-nav">
      <SectionHeader icon={UserCircle} title={t.profile.title} subtitle={t.profile.subtitle} />

      {/* Tarjeta de perfil */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glow-border mt-6 overflow-hidden rounded-3xl"
      >
        <div className="h-20 bg-gradient-to-r from-brand/40 to-accent/40" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            {user?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photo} alt="" className="h-20 w-20 rounded-2xl ring-4 ring-background" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-3xl font-extrabold text-white ring-4 ring-background">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="pb-1">
              <h2 className="text-xl font-bold">{name}</h2>
              <p className="text-sm text-muted">{user?.email ?? t.profile.member}</p>
            </div>
          </div>

          {/* Nivel + XP + ranking */}
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="glass rounded-2xl p-3">
              <p className="text-2xl font-extrabold text-gradient">{lvl.level}</p>
              <p className="text-xs text-muted">{t.profile.level}</p>
            </div>
            <div className="glass rounded-2xl p-3">
              <p className="text-2xl font-extrabold text-gradient">{xp}</p>
              <p className="text-xs text-muted">{t.profile.xp}</p>
            </div>
            <div className="glass rounded-2xl p-3">
              <p className="text-2xl font-extrabold text-gradient">{rank ? `#${rank}` : "—"}</p>
              <p className="text-xs text-muted">{t.profile.rank}</p>
            </div>
          </div>

          {/* Barra de XP */}
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${lvl.progress * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="mt-1.5 text-right text-xs text-muted">
              {lvl.toNext} {t.profile.xp} → {t.ui.level} {lvl.level + 1}
            </p>
          </div>

          {streak > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-warn/10 px-3 py-2 text-sm">
              <Flame className="h-4 w-4 text-warn" />
              <span className="font-semibold">{streak}</span>
              <span className="text-muted">{streak === 1 ? t.ui.day : t.ui.days} 🔥</span>
            </div>
          )}

          {/* Perfil de estudio (del onboarding) + editar */}
          {profile.completed && (profile.career || profile.subjects.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
              {profile.career && <span className="glass rounded-full px-2.5 py-1">🎓 {profile.career}</span>}
              {profile.semester && <span className="glass rounded-full px-2.5 py-1">{profile.semester}°</span>}
              {profile.subjects.slice(0, 4).map((s) => (
                <span key={s} className="glass rounded-full px-2.5 py-1">{s}</span>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setProfile({ completed: false })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-medium text-foreground/80 transition hover:bg-white/10"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t.common2.editProfile}
            </button>
            <button
              onClick={shareProgressCard}
              className="shine inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              <Share2 className="h-3.5 w-3.5" />
              {t.profile.shareCard}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Estadísticas */}
      <h3 className="mb-3 mt-7 font-bold">{t.profile.stats}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="glass rounded-2xl p-4 text-center">
              <Icon className="mx-auto h-5 w-5 text-accent" />
              <p className="mt-2 text-2xl font-extrabold tabular-nums">{c.value}</p>
              <p className="text-xs text-muted">{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* Logros */}
      <h3 className="mb-3 mt-7 flex items-center gap-2 font-bold">
        <Trophy className="h-5 w-5 text-warn" />
        {t.profile.achievements}
      </h3>
      <div className="flex flex-wrap gap-3">
        {badges.map((b, i) => (
          <span
            key={i}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl text-2xl",
              b.unlocked ? "glass" : "glass opacity-30 grayscale"
            )}
          >
            {b.emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
