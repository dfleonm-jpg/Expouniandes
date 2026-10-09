"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Sparkles, Loader2, RotateCcw, Lightbulb, ListTree, BookMarked, Save } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { useToast } from "../ui/Toast";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import { FileUploadButton } from "../ui/FileUploadButton";
import { SpeakButton } from "../ui/SpeakButton";
import { RichText } from "../ui/RichText";
import type { SummaryResult } from "@/lib/types";

const MAX_CHARS = 12000;

export function Summary() {
  const { t, locale, addStat, addDoc } = useApp();
  const { notify } = useToast();
  const { loading, error, data, run, reset, setError } = useAIRequest<SummaryResult>();
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  async function generate() {
    if (text.trim().length < 40) return;
    const res = await run("/api/summary", { text: text.slice(0, MAX_CHARS), locale });
    if (res) addStat("summariesCreated", 1);
  }

  function saveAsDoc() {
    if (data && !saved) {
      addDoc(data.title || t.summary.title, text.slice(0, MAX_CHARS));
      setSaved(true);
      notify("success", t.documents.added);
    }
  }

  function startOver() {
    reset();
    setText("");
    setSaved(false);
  }

  // Texto para leer en voz alta: TL;DR + puntos clave.
  const speakText = data
    ? `${data.tldr}. ${t.summary.keyPoints}: ${data.keyPoints?.join(". ")}`
    : "";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={FileText} title={t.summary.title} subtitle={t.summary.subtitle} />

      <div className="mt-6 space-y-4">
        {error && <ErrorBanner message={error} onRetry={generate} onDismiss={() => setError(null)} />}

        {!data ? (
          <div className="glass rounded-3xl p-6 sm:p-8">
            <div className="mb-3 flex justify-end">
              <FileUploadButton onExtracted={(_, extracted) => setText(extracted)} />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.summary.placeholder}
              rows={10}
              className="glass w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
            <p className={`mt-2 text-right text-xs ${text.length > MAX_CHARS ? "text-danger" : "text-muted"}`}>
              {text.length} / {MAX_CHARS}
            </p>
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
              <div className="flex items-center gap-4">
                <SpeakButton text={speakText} label="🔊" />
                <button
                  onClick={startOver}
                  className="flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.summary.new}
                </button>
              </div>
            </div>

            {/* TL;DR */}
            <div className="glass glow-border rounded-2xl p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent">
                <Lightbulb className="h-4 w-4" />
                {t.summary.tldr}
              </div>
              <RichText className="prose-sereno leading-relaxed text-foreground/90">{data.tldr}</RichText>
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
                    <RichText className="prose-sereno">{p}</RichText>
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
                      <RichText className="prose-sereno mt-1 text-xs leading-relaxed text-muted">{c.definition}</RichText>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={saveAsDoc}
              disabled={saved}
              className="glass flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saved ? t.documents.added : t.summary.askTutor}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
