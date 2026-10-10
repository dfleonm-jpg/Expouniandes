"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Network, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import type { MindMap as MindMapType } from "@/lib/types";

const BRANCH_COLORS = [
  "from-violet-500 to-indigo-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-fuchsia-500 to-purple-500",
];

export function MindMap() {
  const { t, locale } = useApp();
  const { loading, error, data, run, reset, setError } = useAIRequest<MindMapType>();
  const [topic, setTopic] = useState("");

  async function generate() {
    if (!topic.trim()) return;
    await run("/api/mindmap", { topic, locale });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={Network} title={t.mindmap.title} subtitle={t.mindmap.subtitle} />

      <div className="mt-6 space-y-4">
        {error && <ErrorBanner message={error} onRetry={generate} onDismiss={() => setError(null)} />}

        {!data ? (
          <div className="glass rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder={t.mindmap.placeholder}
                className="glass flex-1 rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
              <button
                onClick={generate}
                disabled={!topic.trim() || loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {loading ? t.mindmap.generating : t.mindmap.generate}
              </button>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => {
                  reset();
                  setTopic("");
                }}
                className="flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                {t.mindmap.new}
              </button>
            </div>

            {/* Nodo central */}
            <div className="mb-6 flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 14 }}
                className="glow-border rounded-2xl bg-gradient-to-br from-brand to-accent px-6 py-4 text-center shadow-lg shadow-brand/30"
              >
                <p className="text-[10px] uppercase tracking-widest text-white/70">{t.mindmap.central}</p>
                <p className="text-lg font-bold text-white">{data.central}</p>
              </motion.div>
            </div>

            {/* Ramas */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.branches.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass overflow-hidden rounded-2xl"
                >
                  <div className={`bg-gradient-to-r ${BRANCH_COLORS[i % BRANCH_COLORS.length]} px-4 py-2.5`}>
                    <p className="font-semibold text-white">{b.label}</p>
                  </div>
                  <ul className="space-y-1.5 p-4">
                    {b.items?.map((it, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-foreground/85">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
