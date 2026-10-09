"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Sparkles, Loader2, RotateCcw, Upload, Lightbulb, ListTree, BookMarked } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import type { SummaryResult } from "@/lib/types";

export function Summary() {
  const { t, locale, addStat, addDoc } = useApp();
  const { loading, error, data, run, reset, setError } = useAIRequest<SummaryResult>();
  const [text, setText] = useState("");

  async function generate() {
    if (text.trim().length < 40) return;
    const res = await run("/api/summary", { text, locale });
    if (res) addStat("summariesCreated", 1);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
  }

  function saveAsDoc() {
    if (data) addDoc(data.title || "Resumen", text);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={FileText} title={t.summary.title} subtitle={t.summary.subtitle} />

      <div className="mt-6 space-y-4">
        {error && <ErrorBanner message={error} onRetry={generate} onDismiss={() => setError(null)} />}

        {!data ? (
          <div className="glass rounded-3xl p-6 sm:p-8">
            <div className="mb-3 flex justify-end">
              <label className="glass flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:bg-white/10">
                <Upload className="h-3.5 w-3.5" />
                {t.documents.upload}
                <input type="file" accept=".txt,.md,text/plain" onChange={onFile} className="hidden" />
              </label>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.summary.placeholder}
              rows={10}
              className="glass w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
            <p className="mt-2 text-right text-xs text-muted">{text.length} / 12000</p>
            <button
              onClick={generate}
              disabled={text.trim().length < 40 || loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand/25 transition hover:shadow-xl disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {loading ? t.summary.generating : t.summary.generate}
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{data.title}</h2>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                {t.summary.new}
              </button>
            </div>

            {/* TL;DR */}
            <div className="glass glow-border rounded-2xl p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent">
                <Lightbulb className="h-4 w-4" />
                {t.summary.tldr}
              </div>
              <p className="leading-relaxed text-foreground/90">{data.tldr}</p>
            </div>

            {/* Puntos clave */}
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand">
                <ListTree className="h-4 w-4" />
                {t.summary.keyPoints}
              </div>
              <ul className="space-y-2">
                {data.keyPoints?.map((p, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Conceptos */}
            {data.concepts?.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-calm">
                  <BookMarked className="h-4 w-4" />
                  {t.summary.concepts}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.concepts.map((c, i) => (
                    <div key={i} className="rounded-xl bg-white/[0.03] p-3">
                      <p className="text-sm font-semibold">{c.term}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{c.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={saveAsDoc}
              className="glass w-full rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/10"
            >
              💾 {t.documents.added}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
