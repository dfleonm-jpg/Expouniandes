"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Plus, Trash2, CalendarDays } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";
import { cn } from "@/lib/utils";

export function Calendar() {
  const { t, examEvents, addExamEvent, removeExamEvent } = useApp();
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [today, setToday] = useState("");

  // La fecha de hoy se calcula en el cliente (evita problemas de prerender).
  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  function add() {
    if (!subject.trim() || !date) return;
    addExamEvent(subject.trim(), date);
    setSubject("");
    setDate("");
  }

  function daysUntil(d: string): number {
    if (!today) return 0;
    const a = new Date(today + "T00:00:00");
    const b = new Date(d + "T00:00:00");
    return Math.round((b.getTime() - a.getTime()) / 864e5);
  }

  function countdownLabel(d: string): string {
    const n = daysUntil(d);
    if (n === 0) return t.calendar.today;
    if (n === 1) return t.calendar.tomorrow;
    if (n > 1) return t.calendar.inDays.replace("{n}", String(n));
    return t.calendar.daysAgo.replace("{n}", String(Math.abs(n)));
  }

  const upcoming = examEvents.filter((e) => daysUntil(e.date) >= 0);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={CalendarClock} title={t.calendar.title} subtitle={t.calendar.subtitle} />

      {/* Formulario */}
      <div className="glass mt-6 rounded-3xl p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder={t.calendar.subjectPlaceholder}
            className="glass rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="glass rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 [color-scheme:dark]"
          />
          <button
            onClick={add}
            disabled={!subject.trim() || !date}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            {t.calendar.add}
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="mt-5">
        {upcoming.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center text-muted">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-60" />
            {t.calendar.empty}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {upcoming.map((e, i) => {
                const n = daysUntil(e.date);
                const urgent = n <= 2;
                const soon = n <= 7;
                return (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass group flex items-center gap-4 rounded-2xl p-4"
                  >
                    <div
                      className={cn(
                        "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl",
                        urgent ? "bg-danger/20 text-danger" : soon ? "bg-warn/20 text-warn" : "bg-calm/20 text-calm"
                      )}
                    >
                      <span className="text-xl font-extrabold leading-none">{n}</span>
                      <span className="text-[9px] uppercase">{n === 1 ? t.ui.day : t.ui.days}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{e.subject}</p>
                      <p className="text-sm text-muted">
                        {new Date(e.date + "T00:00:00").toLocaleDateString(undefined, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs font-medium",
                          urgent ? "text-danger" : soon ? "text-warn" : "text-calm"
                        )}
                      >
                        {countdownLabel(e.date)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeExamEvent(e.id)}
                      aria-label={t.calendar.remove}
                      className="text-muted opacity-0 transition hover:text-danger group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
