"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookX, Trash2, Check, X, ChevronDown, Lightbulb } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";
import { RichText } from "../ui/RichText";
import { cn } from "@/lib/utils";

export function Mistakes() {
  const { t, quizErrors, clearQuizErrors } = useApp();
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  // Agrupa los errores por tema.
  const groups = useMemo(() => {
    const map = new Map<string, typeof quizErrors>();
    for (const e of quizErrors) {
      const k = e.topic || t.quiz.title;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return Array.from(map.entries());
  }, [quizErrors, t.quiz.title]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-nav">
      <SectionHeader icon={BookX} title={t.mistakes.title} subtitle={t.mistakes.subtitle} />

      {quizErrors.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center"
        >
          <BookX className="h-10 w-10 text-muted/60" />
          <p className="mt-3 text-muted">{t.mistakes.empty}</p>
        </motion.div>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Resumen + limpiar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <p className="text-sm text-foreground/80">
              <span className="font-bold text-accent">{quizErrors.length}</span> {t.mistakes.saved}
            </p>
            <button
              onClick={clearQuizErrors}
              className="flex items-center gap-1.5 text-xs text-muted transition hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" /> {t.mistakes.clearAll}
            </button>
          </motion.div>

          {/* Grupos por tema (acordeón animado) */}
          {groups.map(([topic, errs], gi) => {
            const isOpen = openTopic === topic;
            return (
              <motion.div
                key={topic}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05 }}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
              >
                <button
                  onClick={() => setOpenTopic(isOpen ? null : topic)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-danger/15 text-xs font-bold text-danger">
                    {errs.length}
                  </span>
                  <span className="flex-1 truncate font-semibold">{topic}</span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", isOpen && "rotate-180")} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 px-4 pb-4">
                        {errs.map((e, i) => (
                          <motion.div
                            key={e.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="rounded-xl border border-white/10 bg-black/20 p-3.5"
                          >
                            <RichText className="prose-sereno text-sm font-medium">{e.question}</RichText>
                            <div className="mt-2.5 space-y-1.5 text-sm">
                              <p className="flex items-start gap-2 text-danger/90">
                                <X className="mt-0.5 h-4 w-4 shrink-0" />
                                <span><span className="text-muted">{t.mistakes.yourAnswer}:</span> {e.chosen}</span>
                              </p>
                              <p className="flex items-start gap-2 text-calm">
                                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                                <span><span className="text-muted">{t.mistakes.correctAnswer}:</span> {e.correct}</span>
                              </p>
                            </div>
                            {e.explanation && (
                              <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-accent/10 p-2.5 text-xs text-foreground/80">
                                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                                <RichText className="prose-sereno [&_p]:m-0">{e.explanation}</RichText>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
