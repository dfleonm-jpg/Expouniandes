"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Loader2,
  Clock,
  AlertTriangle,
  Check,
  X,
  Trophy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useToast } from "../ui/Toast";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import { RichText } from "../ui/RichText";
import { cn } from "@/lib/utils";
import type { QuizQuestion, Difficulty } from "@/lib/types";

type Phase = "setup" | "loading" | "exam" | "results";

const DURATIONS = [
  { minutes: 30, key: "min30" as const },
  { minutes: 60, key: "min60" as const },
  { minutes: 90, key: "min90" as const },
];

export function Exam() {
  const { t, locale, addStat } = useApp();
  const { notify } = useToast();

  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [numQ, setNumQ] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [error, setError] = useState("");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const warned = useRef(false);

  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
  const totalSeconds = minutes * 60;

  const finish = useCallback(() => {
    setPhase("results");
    addStat("quizzesTaken", 1);
    addStat("questionsAnswered", questions.length);
  }, [addStat, questions.length]);

  // Temporizador
  useEffect(() => {
    if (phase !== "exam") return;
    if (secondsLeft <= 0) {
      notify("info", t.exam.timeUp);
      finish();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    // Aviso a los 5 minutos.
    if (secondsLeft === 300 && !warned.current) {
      warned.current = true;
      notify("info", t.exam.warning5min);
    }
    return () => clearTimeout(id);
  }, [phase, secondsLeft, finish, notify, t.exam.timeUp, t.exam.warning5min]);

  async function start() {
    if (!topic.trim()) return;
    setPhase("loading");
    setError("");
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count: numQ, difficulty, locale }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions?.length) throw new Error(data.error || t.common.error);
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(-1));
      setCurrent(0);
      setSecondsLeft(totalSeconds);
      warned.current = false;
      setReviewing(false);
      setPhase("exam");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
      setPhase("setup");
    }
  }

  function selectAnswer(qIdx: number, optIdx: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  }

  function reset() {
    setPhase("setup");
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setReviewing(false);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const answeredCount = answers.filter((a) => a !== -1).length;
  const timeDanger = secondsLeft <= 300;
  const pct10 = Math.round((score / Math.max(questions.length, 1)) * 10 * 10) / 10;
  const passed = score / Math.max(questions.length, 1) >= 0.6;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={GraduationCap} title={t.exam.title} subtitle={t.exam.subtitle} />

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {/* ---------- SETUP ---------- */}
          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="glass rounded-3xl p-6 sm:p-8"
            >
              {error && (
                <div className="mb-4">
                  <ErrorBanner message={error} onRetry={start} onDismiss={() => setError("")} />
                </div>
              )}

              <label className="mb-2 block text-sm font-medium text-foreground/80">{t.exam.topicLabel}</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t.exam.topicPlaceholder}
                className="glass w-full rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
              />

              {/* Duración */}
              <label className="mt-5 mb-2 block text-sm font-medium text-foreground/80">{t.exam.durationLabel}</label>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.minutes}
                    onClick={() => setMinutes(d.minutes)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-sm font-medium transition",
                      minutes === d.minutes
                        ? "bg-gradient-to-br from-brand to-accent text-white"
                        : "glass text-muted hover:text-foreground"
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    {t.exam[d.key]}
                  </button>
                ))}
              </div>

              {/* Preguntas + dificultad */}
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground/80">
                    {t.exam.questionsLabel}: <span className="text-brand">{numQ}</span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={12}
                    value={numQ}
                    onChange={(e) => setNumQ(Number(e.target.value))}
                    className="w-full accent-[var(--brand)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground/80">{t.exam.difficulty}</label>
                  <div className="flex gap-2">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "flex-1 rounded-xl px-2 py-2 text-xs font-medium transition",
                          difficulty === d
                            ? "bg-gradient-to-r from-brand to-accent text-white"
                            : "glass text-muted hover:text-foreground"
                        )}
                      >
                        {t.exam[d]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={start}
                disabled={!topic.trim()}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand/25 transition hover:shadow-xl disabled:opacity-40"
              >
                <GraduationCap className="h-5 w-5" />
                {t.exam.start}
              </button>
            </motion.div>
          )}

          {/* ---------- LOADING ---------- */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass flex flex-col items-center justify-center rounded-3xl p-16 text-center"
            >
              <Loader2 className="h-10 w-10 animate-spin text-brand" />
              <p className="mt-4 text-muted">{t.exam.generating}</p>
            </motion.div>
          )}

          {/* ---------- EXAM ---------- */}
          {phase === "exam" && questions[current] && (
            <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Barra superior: tiempo + progreso */}
              <div className="glass-strong sticky top-20 z-10 mb-4 flex items-center justify-between gap-3 rounded-2xl p-3 lg:top-4">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-lg font-bold tabular-nums transition",
                    timeDanger ? "bg-danger/20 text-danger" : "bg-white/5 text-foreground"
                  )}
                >
                  {timeDanger ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  {mm}:{ss}
                </div>
                <div className="flex-1 text-right text-xs text-muted">
                  {answeredCount}/{questions.length} {t.exam.answered}
                </div>
              </div>

              {/* Grid de navegación de preguntas */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    aria-label={`${t.exam.question} ${i + 1}`}
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs font-semibold transition",
                      i === current
                        ? "bg-brand text-white ring-2 ring-brand/50"
                        : answers[i] !== -1
                          ? "bg-calm/25 text-calm"
                          : "glass text-muted hover:text-foreground"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Pregunta */}
              <div className="glass rounded-3xl p-6 sm:p-8">
                <p className="mb-1 text-xs uppercase tracking-widest text-accent">
                  {t.exam.question} {current + 1}/{questions.length}
                </p>
                <RichText className="prose-sereno text-lg font-semibold leading-relaxed">
                  {questions[current].question}
                </RichText>

                <div className="mt-5 space-y-3">
                  {questions[current].options.map((opt, i) => {
                    const selected = answers[current] === i;
                    return (
                      <button
                        key={i}
                        onClick={() => selectAnswer(current, i)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                          selected
                            ? "border-brand/60 bg-brand/15 text-foreground"
                            : "glass border-transparent hover:bg-white/10"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            selected ? "bg-brand text-white" : "bg-white/10"
                          )}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <RichText className="prose-sereno [&_p]:m-0">{opt}</RichText>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navegación */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
                  disabled={current === 0}
                  className="glass flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm transition hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t.exam.prev}
                </button>

                {current === questions.length - 1 ? (
                  <button
                    onClick={() => {
                      if (confirm(t.exam.confirmFinish)) finish();
                    }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-calm to-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    <Check className="h-4 w-4" />
                    {t.exam.finish}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrent((c) => Math.min(c + 1, questions.length - 1))}
                    className="glass flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm transition hover:bg-white/10"
                  >
                    {t.exam.next}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  if (confirm(t.exam.confirmFinish)) finish();
                }}
                className="mt-3 w-full text-center text-xs text-muted underline-offset-2 transition hover:text-foreground hover:underline"
              >
                {t.exam.finish}
              </button>
            </motion.div>
          )}

          {/* ---------- RESULTS ---------- */}
          {phase === "results" && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              {!reviewing ? (
                <div className="glass rounded-3xl p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className={cn(
                      "mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br",
                      passed ? "from-calm to-emerald-500" : "from-warn to-danger"
                    )}
                  >
                    <Trophy className="h-10 w-10 text-white" />
                  </motion.div>

                  <p className="text-muted">{t.exam.score}</p>
                  <p className="my-2 text-5xl font-extrabold">
                    <span className="text-gradient">{pct10}</span>
                    <span className="text-muted">/10</span>
                  </p>
                  <p className="text-sm text-muted">
                    {score}/{questions.length} · {t.exam.timeTaken}: {Math.floor((totalSeconds - secondsLeft) / 60)} min
                  </p>
                  <p className="mt-4 font-medium">{passed ? t.exam.passed : t.exam.failed}</p>

                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <button
                      onClick={() => setReviewing(true)}
                      className="glass rounded-xl px-5 py-3 text-sm font-medium transition hover:bg-white/10"
                    >
                      {t.exam.review}
                    </button>
                    <button
                      onClick={reset}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t.exam.retry}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold">{t.exam.results}</h3>
                  {questions.map((q, i) => {
                    const userAns = answers[i];
                    const correct = userAns === q.correctIndex;
                    return (
                      <div key={i} className="glass rounded-2xl p-4">
                        <div className="mb-2 flex items-start gap-2">
                          <span
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                              correct ? "bg-calm text-black" : "bg-danger text-black"
                            )}
                          >
                            {correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </span>
                          <RichText className="prose-sereno text-sm font-medium">{q.question}</RichText>
                        </div>
                        <div className="ml-8 space-y-1 text-xs">
                          <div className={cn("flex gap-1", correct ? "text-calm" : "text-danger")}>
                            <span>{t.exam.yourAnswer}:</span>
                            <RichText className="prose-sereno [&_p]:m-0">
                              {userAns >= 0 ? q.options[userAns] : t.exam.noAnswer}
                            </RichText>
                          </div>
                          {!correct && (
                            <div className="flex gap-1 text-calm">
                              <span>{t.exam.correctAnswer}:</span>
                              <RichText className="prose-sereno [&_p]:m-0">{q.options[q.correctIndex]}</RichText>
                            </div>
                          )}
                          <RichText className="prose-sereno text-muted">{q.explanation}</RichText>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={reset}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t.exam.retry}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
