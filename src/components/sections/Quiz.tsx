"use client";
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListChecks, Check, X, RotateCcw, Trophy, Loader2, Sparkles } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";
import { cn } from "@/lib/utils";

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type Phase = "setup" | "loading" | "quiz" | "results";

export function Quiz() {
  const { t, locale, addStat } = useApp();
  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState("");

  async function generate() {
    if (!topic.trim()) return;
    setPhase("loading");
    setError("");
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count, difficulty, locale }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions?.length) throw new Error(data.error || t.common.error);
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(-1));
      setCurrent(0);
      setPhase("quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
      setPhase("setup");
    }
  }

  function answer(optionIndex: number) {
    if (answers[current] !== -1) return;
    const next = [...answers];
    next[current] = optionIndex;
    setAnswers(next);
  }

  function nextQuestion() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      const score = questions.reduce(
        (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
        0
      );
      addStat("quizzesTaken", 1);
      addStat("questionsAnswered", questions.length);
      setPhase("results");
      void score;
    }
  }

  function reset() {
    setPhase("setup");
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
  }

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
    0
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 lg:pb-8">
      <SectionHeader icon={ListChecks} title={t.quiz.title} subtitle={t.quiz.subtitle} />

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {/* SETUP */}
          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="glass rounded-3xl p-6 sm:p-8"
            >
              <label className="mb-2 block text-sm font-medium text-foreground/80">
                {t.quiz.topicLabel}
              </label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder={t.quiz.topicPlaceholder}
                className="glass w-full rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
              />

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground/80">
                    {t.quiz.count}: <span className="text-brand">{count}</span>
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full accent-[var(--brand)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground/80">
                    {t.quiz.difficulty}
                  </label>
                  <div className="flex gap-2">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition",
                          difficulty === d
                            ? "bg-gradient-to-r from-brand to-accent text-white"
                            : "glass text-muted hover:text-foreground"
                        )}
                      >
                        {t.quiz[d]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && <p className="mt-4 text-sm text-danger">{error}</p>}

              <button
                onClick={generate}
                disabled={!topic.trim()}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand/25 transition hover:shadow-xl hover:shadow-brand/40 disabled:opacity-40"
              >
                <Sparkles className="h-5 w-5" />
                {t.quiz.generate}
              </button>
            </motion.div>
          )}

          {/* LOADING */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass flex flex-col items-center justify-center rounded-3xl p-16 text-center"
            >
              <Loader2 className="h-10 w-10 animate-spin text-brand" />
              <p className="mt-4 text-muted">{t.quiz.generating}</p>
            </motion.div>
          )}

          {/* QUIZ */}
          {phase === "quiz" && questions[current] && (
            <motion.div
              key={`q-${current}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="glass rounded-3xl p-6 sm:p-8"
            >
              {/* Progreso */}
              <div className="mb-5">
                <div className="mb-2 flex justify-between text-sm text-muted">
                  <span>
                    {t.quiz.questionOf} {current + 1}/{questions.length}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold leading-relaxed">
                {questions[current].question}
              </h3>

              <div className="mt-5 space-y-3">
                {questions[current].options.map((opt, i) => {
                  const selected = answers[current];
                  const isCorrect = i === questions[current].correctIndex;
                  const isSelected = i === selected;
                  const answered = selected !== -1;
                  return (
                    <button
                      key={i}
                      onClick={() => answer(i)}
                      disabled={answered}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                        !answered && "glass hover:bg-white/10 border-transparent",
                        answered && isCorrect && "border-calm/60 bg-calm/15 text-foreground",
                        answered && isSelected && !isCorrect && "border-danger/60 bg-danger/15 text-foreground",
                        answered && !isSelected && !isCorrect && "glass border-transparent opacity-50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          !answered && "bg-white/10",
                          answered && isCorrect && "bg-calm text-black",
                          answered && isSelected && !isCorrect && "bg-danger text-black",
                          answered && !isSelected && !isCorrect && "bg-white/10"
                        )}
                      >
                        {answered && isCorrect ? (
                          <Check className="h-4 w-4" />
                        ) : answered && isSelected && !isCorrect ? (
                          <X className="h-4 w-4" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explicación */}
              <AnimatePresence>
                {answers[current] !== -1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="glass rounded-xl p-4 text-sm">
                      <span className="font-semibold text-accent">{t.quiz.explanation}: </span>
                      <span className="text-foreground/80">{questions[current].explanation}</span>
                    </div>
                    <button
                      onClick={nextQuestion}
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
                    >
                      {current < questions.length - 1 ? "→" : t.quiz.submit}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* RESULTS */}
          {phase === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-3xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-warn to-brand"
              >
                <Trophy className="h-10 w-10 text-white" />
              </motion.div>
              <p className="text-muted">{t.quiz.score}</p>
              <p className="my-2 text-5xl font-extrabold">
                <span className="text-gradient">{score}</span>
                <span className="text-muted">/{questions.length}</span>
              </p>
              <p className="text-muted">
                {Math.round((score / questions.length) * 100)}% {t.quiz.correct}
              </p>
              <button
                onClick={reset}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
              >
                <RotateCcw className="h-4 w-4" />
                {t.quiz.newQuiz}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
