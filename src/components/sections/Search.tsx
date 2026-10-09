"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, FileText, Sparkles, Loader2, Upload } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";
import { RichText } from "../ui/RichText";
import { SpeakButton } from "../ui/SpeakButton";
import { searchDocs, highlightSegments } from "@/lib/search";
import type { Section } from "../Sidebar";

export function Search({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const { t, locale, docs } = useApp();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [askingAI, setAskingAI] = useState(false);

  const results = useMemo(
    () => (submitted ? searchDocs(submitted, docs) : []),
    [submitted, docs]
  );

  function runSearch() {
    setAiAnswer("");
    setSubmitted(query.trim());
  }

  async function askAI() {
    if (results.length === 0) return;
    setAskingAI(true);
    setAiAnswer("");

    const context = results.map((r, i) => `[Fragmento ${i + 1} — ${r.docName}]\n${r.text}`).join("\n\n");
    const messages = [{ role: "user" as const, text: submitted }];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, locale, context }),
      });
      if (!res.ok || !res.body) {
        const payload = await res.json().catch(() => ({}));
        setAiAnswer(`⚠️ ${payload.error || t.common.error}`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setAiAnswer(acc);
      }
    } catch {
      setAiAnswer(`⚠️ ${t.common.error}`);
    } finally {
      setAskingAI(false);
    }
  }

  const hasDocs = docs.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={SearchIcon} title={t.search.title} subtitle={t.search.subtitle} />

      {!hasDocs ? (
        <div className="glass mt-8 rounded-3xl p-10 text-center">
          <FileText className="mx-auto mb-4 h-10 w-10 text-muted" />
          <p className="mb-5 text-muted">{t.search.noDocs}</p>
          <button
            onClick={() => onNavigate("tutor")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            {t.search.goUpload}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* Barra de búsqueda */}
          <div className="glass-strong flex items-center gap-2 rounded-2xl p-2">
            <SearchIcon className="ml-2 h-5 w-5 shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder={t.search.placeholder}
              className="flex-1 bg-transparent px-1 py-2 text-foreground placeholder:text-muted focus:outline-none"
              autoFocus
            />
            <button
              onClick={runSearch}
              disabled={!query.trim()}
              className="rounded-xl bg-gradient-to-r from-brand to-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {t.nav.search}
            </button>
          </div>

          {/* Resultados */}
          {submitted && (
            <div className="space-y-3">
              {results.length === 0 ? (
                <p className="glass rounded-2xl p-6 text-center text-sm text-muted">{t.search.noResults}</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted">
                      {results.length} {t.search.results.toLowerCase()}
                    </p>
                    <button
                      onClick={askAI}
                      disabled={askingAI}
                      className="flex items-center gap-1.5 rounded-xl bg-brand/15 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/25 disabled:opacity-60"
                    >
                      {askingAI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {t.search.askAI}
                    </button>
                  </div>

                  {/* Respuesta IA */}
                  <AnimatePresence>
                    {(aiAnswer || askingAI) && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass glow-border rounded-2xl p-5"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm font-semibold text-accent">
                            <Sparkles className="h-4 w-4" />
                            {t.search.aiAnswer}
                          </span>
                          {aiAnswer && !askingAI && <SpeakButton text={aiAnswer} label="🔊" />}
                        </div>
                        {aiAnswer ? (
                          <RichText>{aiAnswer}</RichText>
                        ) : (
                          <p className="flex items-center gap-2 text-sm text-muted">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t.search.askingAI}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Fragmentos encontrados */}
                  {results.map((r, i) => (
                    <motion.div
                      key={`${r.docId}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="glass rounded-2xl p-4"
                    >
                      <div className="mb-2 flex items-center gap-1.5 text-xs text-muted">
                        <FileText className="h-3.5 w-3.5 text-brand" />
                        {t.search.inDoc} <span className="font-medium text-foreground/80">{r.docName}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/85">
                        {highlightSegments(r.text, submitted).map((seg, j) =>
                          seg.hit ? (
                            <mark key={j} className="rounded bg-warn/30 px-0.5 text-warn">
                              {seg.text}
                            </mark>
                          ) : (
                            <span key={j}>{seg.text}</span>
                          )
                        )}
                      </p>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
