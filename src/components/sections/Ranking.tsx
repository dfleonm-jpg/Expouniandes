"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2, Crown, Medal } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";
import { getLeaderboard, type LeaderEntry } from "@/lib/leaderboard-store";
import { SectionHeader } from "../ui/SectionHeader";
import { cn } from "@/lib/utils";

export function Ranking() {
  const { t } = useApp();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderEntry[] | null>(null);

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
    <div className="mx-auto max-w-2xl px-4 pb-28 lg:pb-10">
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
    </div>
  );
}
