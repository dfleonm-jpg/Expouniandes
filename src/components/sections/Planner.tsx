"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, Check, Trash2, Play, Pause, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";
import { cn } from "@/lib/utils";

type Task = { id: string; text: string; done: boolean };

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export function Planner() {
  const { t, addStat } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");

  // Pomodoro
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [seconds, setSeconds] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cargar/guardar tareas
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sereno:tasks");
      if (saved) setTasks(JSON.parse(saved));
    } catch {}
  }, []);

  const saveTasks = useCallback((next: Task[]) => {
    setTasks(next);
    try {
      localStorage.setItem("sereno:tasks", JSON.stringify(next));
    } catch {}
  }, []);

  function addTask() {
    if (!input.trim()) return;
    saveTasks([...tasks, { id: crypto.randomUUID(), text: input.trim(), done: false }]);
    setInput("");
  }

  function toggleTask(id: string) {
    const next = tasks.map((task) => {
      if (task.id === id) {
        if (!task.done) addStat("tasksDone", 1);
        return { ...task, done: !task.done };
      }
      return task;
    });
    saveTasks(next);
  }

  function removeTask(id: string) {
    saveTasks(tasks.filter((task) => task.id !== id));
  }

  // Timer
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            // Fin de sesión
            if (mode === "focus") addStat("focusMinutes", 25);
            const nextMode = mode === "focus" ? "break" : "focus";
            setMode(nextMode);
            setRunning(false);
            return nextMode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, addStat]);

  function resetTimer() {
    setRunning(false);
    setSeconds(mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS);
  }

  function switchMode(m: "focus" | "break") {
    setMode(m);
    setRunning(false);
    setSeconds(m === "focus" ? FOCUS_SECONDS : BREAK_SECONDS);
  }

  const total = mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;
  const pct = ((total - seconds) / total) * 100;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const doneCount = tasks.filter((task) => task.done).length;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 lg:pb-8">
      <SectionHeader icon={Clock} title={t.planner.title} subtitle={t.planner.subtitle} />

      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        {/* Tareas */}
        <div className="glass rounded-3xl p-6 lg:col-span-3">
          <div className="mb-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder={t.planner.taskPlaceholder}
              className="glass flex-1 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
            <button
              onClick={addTask}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-white transition hover:opacity-90"
              aria-label={t.planner.addTask}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {tasks.length > 0 && (
            <p className="mb-3 text-xs text-muted">
              {doneCount}/{tasks.length} {t.planner.completed}
            </p>
          )}

          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">{t.planner.noTasks}</p>
            ) : (
              <AnimatePresence initial={false}>
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group glass flex items-center gap-3 rounded-xl px-3 py-2.5"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition",
                        task.done
                          ? "border-calm bg-calm text-black"
                          : "border-white/20 hover:border-brand"
                      )}
                    >
                      {task.done && <Check className="h-4 w-4" />}
                    </button>
                    <span className={cn("flex-1 text-sm", task.done && "text-muted line-through")}>
                      {task.text}
                    </span>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="text-muted opacity-0 transition hover:text-danger group-hover:opacity-100"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Pomodoro */}
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h3 className="mb-4 text-center text-sm font-semibold text-muted">{t.planner.pomodoro}</h3>

          <div className="mb-5 flex justify-center gap-2">
            <button
              onClick={() => switchMode("focus")}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition",
                mode === "focus" ? "bg-brand/20 text-brand" : "text-muted hover:text-foreground"
              )}
            >
              {t.planner.focus}
            </button>
            <button
              onClick={() => switchMode("break")}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition",
                mode === "break" ? "bg-calm/20 text-calm" : "text-muted hover:text-foreground"
              )}
            >
              {t.planner.break}
            </button>
          </div>

          {/* Círculo */}
          <div className="relative mx-auto mb-6 h-48 w-48">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={mode === "focus" ? "var(--brand)" : "var(--calm)"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - pct / 100) }}
                transition={{ ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold tabular-nums">
                {mm}:{ss}
              </span>
              <span className="mt-1 text-xs uppercase tracking-wider text-muted">
                {mode === "focus" ? t.planner.focus : t.planner.break}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {running ? t.planner.pause : t.planner.start}
            </button>
            <button
              onClick={resetTimer}
              className="glass flex items-center justify-center rounded-xl px-4 py-3 text-foreground transition hover:bg-white/10"
              aria-label={t.planner.reset}
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
