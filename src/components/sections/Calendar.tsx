"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Plus, Trash2, CalendarDays, CalendarPlus, ShieldCheck, Gauge, Flame } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useToast } from "../ui/Toast";
import { downloadICS } from "@/lib/export";
import { SectionHeader } from "../ui/SectionHeader";
import { cn } from "@/lib/utils";

export function Calendar() {
  const { t, examEvents, addExamEvent, removeExamEvent, profile } = useApp();
  const { notify } = useToast();
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

  // ---- Detector de sobrecarga académica (cálculo local, instantáneo) ----
  // Combina: nº de parciales en los próximos 14 días, cuántos se agrupan en
  // una misma semana, cercanía, y el nivel de estrés declarado en el perfil.
  const overload = (() => {
    if (!today) return null;
    const next14 = upcoming.filter((e) => daysUntil(e.date) <= 14);
    if (next14.length === 0) return null;

    const next7 = next14.filter((e) => daysUntil(e.date) <= 7);
    const next3 = next14.filter((e) => daysUntil(e.date) <= 3);

    // Semana más cargada (máximo de parciales en cualquier ventana de 7 días).
    let maxWeek = 0;
    for (const base of next14) {
      const start = daysUntil(base.date);
      const inWindow = next14.filter((e) => {
        const d = daysUntil(e.date);
        return d >= start && d < start + 7;
      }).length;
      maxWeek = Math.max(maxWeek, inWindow);
    }

    const stressBoost = profile.stressLevel === "high" ? 2 : profile.stressLevel === "mid" ? 1 : 0;
    const score = next7.length * 2 + next3.length * 2 + (maxWeek >= 3 ? 3 : maxWeek === 2 ? 1 : 0) + stressBoost;

    const level: "calm" | "moderate" | "high" = score >= 7 ? "high" : score >= 4 ? "moderate" : "calm";
    return { level, count14: next14.length, count7: next7.length, maxWeek };
  })();

  function exportCalendar() {
    if (upcoming.length === 0) return;
    downloadICS(
      "sereno-examenes",
      upcoming.map((e) => ({ title: `📝 ${e.subject}`, date: e.date, durationMin: 120, description: "Sereno" }))
    );
    notify("success", t.ui.exportedCal);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 lg:pb-10">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader icon={CalendarClock} title={t.calendar.title} subtitle={t.calendar.subtitle} />
        {upcoming.length > 0 && (
          <button
            onClick={exportCalendar}
            className="glass flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition hover:bg-white/10"
          >
            <CalendarPlus className="h-4 w-4 text-accent" />
            <span className="hidden sm:inline">{t.ui.exportIcs}</span>
          </button>
        )}
      </div>

      {/* Detector de sobrecarga académica */}
      {overload && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-6 flex items-start gap-3 rounded-3xl border p-5",
            overload.level === "high"
              ? "border-danger/30 bg-danger/10"
              : overload.level === "moderate"
                ? "border-warn/30 bg-warn/10"
                : "border-calm/30 bg-calm/10"
          )}
        >
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              overload.level === "high"
                ? "bg-danger/20 text-danger"
                : overload.level === "moderate"
                  ? "bg-warn/20 text-warn"
                  : "bg-calm/20 text-calm"
            )}
          >
            {overload.level === "high" ? (
              <Flame className="h-5 w-5" />
            ) : overload.level === "moderate" ? (
              <Gauge className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {overload.level === "high"
                ? t.calendar.overloadHigh
                : overload.level === "moderate"
                  ? t.calendar.overloadMid
                  : t.calendar.overloadLow}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {t.calendar.overloadDetail
                .replace("{n}", String(overload.count14))
                .replace("{w}", String(overload.maxWeek))}
            </p>
            {overload.level !== "calm" && (
              <p className="mt-2 text-xs text-foreground/80">
                {overload.level === "high" ? t.calendar.overloadTipHigh : t.calendar.overloadTipMid}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Formulario */}
      <div className="glass mt-5 rounded-3xl p-5">
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
