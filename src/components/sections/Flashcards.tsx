"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Sparkles, Loader2, ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import { RichText } from "../ui/RichText";
import type { Flashcard } from "@/lib/types";

export function Flashcards() {
  const { t, locale, addStat } = useApp();
  const { loading, error, run, setError } = useAIRequest<{ cards: Flashcard[] }>();
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(8);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    const res = await run("/api/flashcards", { topic, count, locale });
    if (res?.cards?.length) {
      setCards(res.cards);
      setIdx(0);
      setFlipped(false);
      addStat("flashcardsReviewed", res.cards.length);
    }
  }

  function go(delta: number) {
    setFlipped(false);
    setIdx((i) => Math.min(Math.max(i + delta, 0), cards.length - 1));
  }

  function reset() {
    setCards([]);
    setTopic("");
    setIdx(0);
    setFlipped(false);
  }

  function shuffle() {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setIdx(0);
    setFlipped(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={Layers} title={t.flashcards.title} subtitle={t.flashcards.subtitle} />

      <div className="mt-6 space-y-4">
        {error && <ErrorBanner message={error} onRetry={generate} onDismiss={() => setError(null)} />}

        {cards.length === 0 ? (
          <div className="glass rounded-3xl p-6 sm:p-8">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder={t.flashcards.topicPlaceholder}
              className="glass w-full rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
            <label className="mt-5 mb-2 block text-sm font-medium text-foreground/80">
              {t.flashcards.count}: <span className="text-brand">{count}</span>
            </label>
            <input
              type="range"
              min={4}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-[var(--brand)]"
            />
            <button
              onClick={generate}
              disabled={!topic.trim() || loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand/25 transition hover:shadow-xl disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {loading ? t.flashcards.generating : t.flashcards.generate}
            </button>
          </div>
        ) : (
          <div>
            {/* Progreso */}
            <div className="mb-4 flex items-center justify-between text-sm text-muted">
              <span>
                {t.flashcards.cardOf} {idx + 1}/{cards.length}
              </span>
              <div className="flex items-center gap-3">
                <button onClick={shuffle} className="flex items-center gap-1.5 transition hover:text-foreground">
                  <Shuffle className="h-4 w-4" />
                  {t.ui.shuffle}
                </button>
                <button onClick={reset} className="flex items-center gap-1.5 transition hover:text-foreground">
                  <RotateCcw className="h-4 w-4" />
                  {t.flashcards.new}
                </button>
              </div>
            </div>

            {/* Tarjeta 3D (compatible con Safari/iOS) */}
            <div style={{ perspective: "1600px" }}>
              <motion.button
                key={idx}
                onClick={() => setFlipped((f) => !f)}
                aria-label={flipped ? cards[idx].back : cards[idx].front}
                className="relative h-72 w-full cursor-pointer rounded-3xl text-left"
                style={{ transformStyle: "preserve-3d", willChange: "transform" }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Frente */}
                <div
                  className="glass absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-8 text-center ring-1 ring-brand/30"
                  style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "translateZ(0)" }}
                >
                  <span className="mb-3 text-xs uppercase tracking-widest text-accent">{t.nav.flashcards}</span>
                  <RichText className="prose-sereno text-xl font-semibold [&_p]:m-0">{cards[idx].front}</RichText>
                  <span className="mt-6 text-xs text-muted">{t.flashcards.flip}</span>
                </div>
                {/* Reverso */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-brand/25 to-accent/25 p-8 text-center ring-1 ring-white/10"
                  style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg) translateZ(0)" }}
                >
                  <RichText className="prose-sereno text-lg leading-relaxed [&_p]:m-0">{cards[idx].back}</RichText>
                </div>
              </motion.button>
            </div>

            {/* Navegación */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                onClick={() => go(-1)}
                disabled={idx === 0}
                className="glass flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm transition hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.flashcards.prev}
              </button>
              {idx === cards.length - 1 ? (
                <span className="text-sm font-medium text-calm">{t.flashcards.done}</span>
              ) : (
                <div className="flex gap-1">
                  {cards.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full transition ${i === idx ? "bg-brand" : "bg-white/15"}`}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={() => go(1)}
                disabled={idx === cards.length - 1}
                className="glass flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm transition hover:bg-white/10 disabled:opacity-30"
              >
                {t.flashcards.next}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
