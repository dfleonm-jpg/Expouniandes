"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2, Crown, Medal, Target, Flame } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";
import { getLeaderboard, type LeaderEntry } from "@/lib/leaderboard-store";
import { subjectBreakdown, subjectChallenges } from "@/lib/mastery";
import { SectionHeader } from "../ui/SectionHeader";
import { cn } from "@/lib/utils";

export function Ranking() {
  const { t, mastery } = useApp();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderEntry[] | null>(null);
  const subjects = subjectBreakdown(mastery);
  const challenges = subjectChallenges(mastery);
  // Ranking de TUS materias: de mayor a menor dominio.
  const mySubjectRanking = [...subjects].sort((a, b) => b.score - a.score);

  useEffect(() => {
    let active = true;
    getLeaderboard(20).then((list) => {
      if (active) setEntries(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const medalColor = (i: number) =>
    i === 0 ? "from-amber-400 to-yellow-500" : i === 1 ? "from-slate-300 to-slate-400" : i === 2 ? "from-orange-500 to-amber-700" : "";

  return (
    <div className="mx-auto max-w-2xl px-4 pb-nav">
      <SectionHeader icon={Trophy} title={t.ranking.title} subtitle={t.ranking.subtitle} />

      <div className="mt-6">
        {entries === null ? (
          <div className="glass flex items-center justify-center gap-2 rounded-3xl p-12 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" /> {t.ranking.loading}
          </div>
        ) : entries.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center text-muted">{t.ranking.empty}</div>
        ) : (
          <div className="space-y-2">
            {entries.map((e, i) => {
              const isYou = user?.uid === e.uid;
              const top3 = i < 3;
              return (
                <motion.div
                  key={e.uid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl p-3",
                    isYou ? "glass-strong ring-2 ring-brand/50" : "glass"
                  )}
                >
                  {/* Posición / medalla */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold",
                      top3 ? `bg-gradient-to-br ${medalColor(i)} text-black` : "bg-white/10 text-muted"
                    )}
                  >
                    {i === 0 ? <Crown className="h-5 w-5" /> : top3 ? <Medal className="h-5 w-5" /> : i + 1}
                  </div>

                  {/* Avatar */}
                  {e.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.photo} alt="" className="h-9 w-9 rounded-full" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-sm font-bold text-white">
                      {(e.name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}

                  {/* Nombre + nivel */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {e.name} {isYou && <span className="text-xs text-brand">({t.ranking.you})</span>}
                    </p>
                    <p className="text-xs text-muted">
                      {t.ranking.level} {e.level}
                    </p>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <p className="font-bold tabular-nums text-gradient">{e.xp}</p>
                    <p className="text-[10px] uppercase text-muted">XP</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!user && <p className="mt-4 text-center text-xs text-muted">{t.ranking.loginNote}</p>}
      </div>

      {/* Retos por materia */}
      {challenges.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Target className="h-5 w-5 text-brand" />
            {t.ranking.challengesTitle}
          </h2>
          <div className="space-y-2">
            {challenges.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-semibold">{c.subject}</span>
                    <span className="ml-2 text-xs text-muted">
                      {c.kind === "fixWeak"
                        ? t.ranking.challFixWeak.replace("{n}", String(c.target))
                        : c.kind === "levelUp"
                          ? t.ranking.challLevelUp.replace("{n}", String(c.target))
                          : t.ranking.challPolish}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">{c.current}% → {c.target}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress * 100}%` }}
                    transition={{ duration: 0.7 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Ranking de tus materias */}
      {mySubjectRanking.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Flame className="h-5 w-5 text-warn" />
            {t.ranking.subjectsTitle}
          </h2>
          <div className="space-y-2">
            {mySubjectRanking.map((s, i) => (
              <div key={s.subjectKey} className="glass flex items-center gap-3 rounded-2xl p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-muted">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.subject}</span>
                <span className="w-24 shrink-0">
                  <span className="mb-0.5 block text-right text-xs tabular-nums text-muted">{s.score}%</span>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
                    <span
                      className={cn("block h-full rounded-full", s.score >= 65 ? "bg-calm" : s.score >= 40 ? "bg-warn" : "bg-danger")}
                      style={{ width: `${s.score}%` }}
                    />
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
