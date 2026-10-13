"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Sparkles, Loader2, Lightbulb, Check, X, AlertTriangle, Info, RotateCcw, Wand2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import { RichText } from "../ui/RichText";
import { cn } from "@/lib/utils";
import type { CodeExercise, CodeReview } from "@/lib/types";

export function CodePractice() {
  const { t, locale, addStat, trackMastery } = useApp();
  const exReq = useAIRequest<CodeExercise>();
  const revReq = useAIRequest<CodeReview>();

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("básico");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [showHints, setShowHints] = useState(false);

  const RESTRICTIONS = [
    { key: "noWhile", label: t.codePractice.noWhile, rule: "no usar while" },
    { key: "noFor", label: t.codePractice.noFor, rule: "no usar for" },
    { key: "noRecursion", label: t.codePractice.noRecursion, rule: "no usar recursividad" },
    { key: "noLibs", label: t.codePractice.noLibs, rule: "no usar librerías/imports" },
    { key: "onlyBasics", label: t.codePractice.onlyBasics, rule: "solo variables, condicionales y ciclos básicos" },
  ];

  function toggleRestriction(rule: string) {
    setRestrictions((prev) => (prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule]));
  }

  async function newExercise() {
    revReq.reset();
    setCode("");
    setShowHints(false);
    const res = await exReq.run("/api/code-exercise", { topic, level, restrictions, locale });
    if (res?.functionSignature) setCode(res.functionSignature + "\n    ");
  }

  async function review() {
    if (!code.trim() || !exReq.data) return;
    const res = await revReq.run("/api/code-review", {
      statement: exReq.data.statement,
      code,
      restrictions,
      locale,
    });
    if (res) {
      addStat("questionsAnswered", 1);
      // Dominio de programación: usa el tema o "Programación (Python)" por defecto.
      trackMastery([{ label: topic.trim() || "Programación (Python)", performance: (res.score / 5) * 100 }]);
    }
  }

  const ex = exReq.data;
  const rev = revReq.data;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-nav">
      <SectionHeader icon={Code2} title={t.codePractice.title} subtitle={t.codePractice.subtitle} />

      {/* Aviso integridad */}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-xs text-foreground/80 ring-1 ring-accent/20">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p>{t.codePractice.integrity}</p>
      </div>

      <div className="mt-5 space-y-4">
        {exReq.error && <ErrorBanner message={exReq.error} onRetry={newExercise} onDismiss={() => exReq.setError(null)} />}

        {/* Configuración (si no hay ejercicio) */}
        {!ex ? (
          <div className="glass rounded-3xl p-6">
            <label className="mb-2 block text-sm font-medium text-foreground/80">{t.codePractice.topicLabel}</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.codePractice.topicPlaceholder}
              className="glass w-full rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
            />

            <label className="mb-2 mt-4 block text-sm font-medium text-foreground/80">{t.codePractice.level}</label>
            <div className="flex gap-2">
              {[
                { v: "básico", l: t.codePractice.levelBasic },
                { v: "intermedio", l: t.codePractice.levelInter },
                { v: "avanzado", l: t.codePractice.levelAdv },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setLevel(o.v)}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition",
                    level === o.v ? "bg-gradient-to-r from-brand to-accent text-white" : "glass text-muted hover:text-foreground"
                  )}
                >
                  {o.l}
                </button>
              ))}
            </div>

            <label className="mb-2 mt-4 block text-sm font-medium text-foreground/80">{t.codePractice.restrictions}</label>
            <div className="flex flex-wrap gap-2">
              {RESTRICTIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => toggleRestriction(r.rule)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    restrictions.includes(r.rule) ? "bg-danger/20 text-danger ring-1 ring-danger/40" : "glass text-muted hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={newExercise}
              disabled={exReq.loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {exReq.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {exReq.loading ? t.codePractice.generating : t.codePractice.newExercise}
            </button>
          </div>
        ) : (
          <>
            {/* Enunciado */}
            <div className="glass rounded-3xl p-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-bold text-brand">{ex.title}</h3>
                <button onClick={newExercise} className="flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground">
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t.codePractice.newExercise}
                </button>
              </div>
              {restrictions.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {restrictions.map((r) => (
                    <span key={r} className="rounded-full bg-danger/15 px-2 py-0.5 text-xs text-danger">🚫 {r}</span>
                  ))}
                </div>
              )}
              <RichText>{ex.statement}</RichText>

              <button
                onClick={() => setShowHints((s) => !s)}
                className="mt-3 flex items-center gap-1.5 text-sm text-accent transition hover:underline"
              >
                <Lightbulb className="h-4 w-4" />
                {t.codePractice.showHints}
              </button>
              <AnimatePresence>
                {showHints && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1 overflow-hidden text-sm text-muted"
                  >
                    {ex.hints?.map((h, i) => (
                      <li key={i}>💡 {h}</li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Editor */}
            <div className="glass overflow-hidden rounded-3xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-xs text-muted">
                <Code2 className="h-4 w-4 text-brand" /> {t.codePractice.yourCode} · Python
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t.codePractice.codePlaceholder}
                spellCheck={false}
                rows={10}
                className="w-full resize-y bg-[#0b0b12] px-4 py-3 font-mono text-sm text-[#e6e6f0] placeholder:text-muted focus:outline-none"
                style={{ tabSize: 4 }}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const s = el.selectionStart;
                    setCode(code.slice(0, s) + "    " + code.slice(el.selectionEnd));
                    requestAnimationFrame(() => (el.selectionStart = el.selectionEnd = s + 4));
                  }
                }}
              />
            </div>

            {revReq.error && <ErrorBanner message={revReq.error} onRetry={review} onDismiss={() => revReq.setError(null)} />}

            <button
              onClick={review}
              disabled={!code.trim() || revReq.loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {revReq.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {revReq.loading ? t.codePractice.reviewing : t.codePractice.review}
            </button>

            {/* Resultado de la revisión */}
            <AnimatePresence>
              {rev && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {/* Veredicto + nota */}
                  <div className="glass glow-border rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold", rev.score >= 3 ? "bg-calm/20 text-calm" : "bg-danger/20 text-danger")}>
                        {rev.score.toFixed(1)}
                      </div>
                      <div>
                        <p className="font-semibold">{rev.summary}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <span className={cn("rounded-full px-2 py-0.5", rev.correct ? "bg-calm/15 text-calm" : "bg-danger/15 text-danger")}>
                            {rev.correct ? <Check className="mr-1 inline h-3 w-3" /> : <X className="mr-1 inline h-3 w-3" />}
                            {rev.correct ? t.mathPractice.correct : t.mathPractice.incorrect}
                          </span>
                          <span className={cn("rounded-full px-2 py-0.5", rev.respectsRestrictions ? "bg-calm/15 text-calm" : "bg-warn/20 text-warn")}>
                            {rev.respectsRestrictions ? t.codePractice.restrictionOk : t.codePractice.restrictionBroken}
                          </span>
                          {rev.complexity && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-foreground/80">
                              {t.codePractice.complexity}: {rev.complexity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Errores */}
                  {rev.errors?.length > 0 && (
                    <div className="glass rounded-2xl p-5">
                      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-danger">
                        <AlertTriangle className="h-4 w-4" />
                        {t.codePractice.errorsTitle}
                      </p>
                      <div className="space-y-3">
                        {rev.errors.map((e, i) => (
                          <div key={i} className="rounded-xl bg-danger/5 p-3 ring-1 ring-danger/15">
                            <p className="text-sm font-medium text-danger">{e.line}: {e.problem}</p>
                            <p className="mt-1 text-xs text-muted"><strong>¿Por qué?</strong> {e.why}</p>
                            <p className="mt-1 text-xs text-calm"><strong>✓ Arreglo:</strong> {e.fix}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mejoras */}
                  {rev.improvements?.length > 0 && (
                    <div className="glass rounded-2xl p-5">
                      <p className="mb-2 text-sm font-semibold text-accent">⚡ {t.codePractice.improveTitle}</p>
                      <ul className="space-y-1 text-sm text-foreground/85">
                        {rev.improvements.map((im, i) => <li key={i}>• {im}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Evitar la próxima vez */}
                  {rev.avoidNextTime?.length > 0 && (
                    <div className="glass rounded-2xl p-5">
                      <p className="mb-2 text-sm font-semibold text-warn">🎯 {t.codePractice.avoidTitle}</p>
                      <ul className="space-y-1 text-sm text-foreground/85">
                        {rev.avoidNextTime.map((a, i) => <li key={i}>• {a}</li>)}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
