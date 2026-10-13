"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  Plus,
  Trash2,
  CalendarDays,
  CalendarPlus,
  ShieldCheck,
  Gauge,
  Flame,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ListChecks,
  FileText,
  FolderKanban,
  Lightbulb,
  X,
} from "lucide-react";
import { useApp, type EventType, type ExamEvent } from "@/lib/app-context";
import { useToast } from "../ui/Toast";
import { downloadICS } from "@/lib/export";
import { SectionHeader } from "../ui/SectionHeader";
import { cn } from "@/lib/utils";

// Metadatos visuales por tipo de evento.
const TYPE_META: Record<EventType, { icon: typeof GraduationCap; dot: string; chip: string }> = {
  exam: { icon: GraduationCap, dot: "bg-danger", chip: "bg-danger/20 text-danger" },
  quiz: { icon: ListChecks, dot: "bg-brand", chip: "bg-brand/20 text-brand" },
  assignment: { icon: FileText, dot: "bg-warn", chip: "bg-warn/20 text-warn" },
  project: { icon: FolderKanban, dot: "bg-accent", chip: "bg-accent/20 text-accent" },
};

export function Calendar() {
  const { t, examEvents, addExamEvent, removeExamEvent, profile } = useApp();
  const { notify } = useToast();

  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<EventType>("exam");
  const [today, setToday] = useState("");
  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null); // mes mostrado
  const [selectedDay, setSelectedDay] = useState<string>(""); // YYYY-MM-DD seleccionado

  // La fecha de hoy se calcula en el cliente (evita problemas de prerender).
  useEffect(() => {
    const now = new Date();
    setToday(now.toISOString().slice(0, 10));
    setCursor({ y: now.getFullYear(), m: now.getMonth() });
  }, []);

  function daysUntil(d: string): number {
    if (!today) return 0;
    return Math.round((new Date(d + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 864e5);
  }

  function countdownLabel(d: string): string {
    const n = daysUntil(d);
    if (n === 0) return t.calendar.today;
    if (n === 1) return t.calendar.tomorrow;
    if (n > 1) return t.calendar.inDays.replace("{n}", String(n));
    return t.calendar.daysAgo.replace("{n}", String(Math.abs(n)));
  }

  function add() {
    if (!subject.trim() || !date) return;
    addExamEvent(subject.trim(), date, type);
    setSubject("");
    setDate("");
    notify("success", t.calendar.added);
  }

  const upcoming = useMemo(
    () => examEvents.filter((e) => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [examEvents, today]
  );

  // Eventos por día (para pintar la grilla).
  const eventsByDay = useMemo(() => {
    const map: Record<string, ExamEvent[]> = {};
    for (const e of examEvents) (map[e.date] ??= []).push(e);
    return map;
  }, [examEvents]);

  // ---- Detector de sobrecarga académica (local, instantáneo) ----
  const overload = useMemo(() => {
    if (!today) return null;
    const next14 = upcoming.filter((e) => daysUntil(e.date) <= 14);
    if (next14.length === 0) return null;
    const next7 = next14.filter((e) => daysUntil(e.date) <= 7);
    const next3 = next14.filter((e) => daysUntil(e.date) <= 3);
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
    return { level, count14: next14.length, maxWeek };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcoming, today, profile.stressLevel]);

  // ---- Sugerencia inteligente: próximo parcial y días de preparación ----
  const nextExam = upcoming.find((e) => (e.type ?? "exam") === "exam") ?? upcoming[0];
  const prepHint = useMemo(() => {
    if (!nextExam) return null;
    const d = daysUntil(nextExam.date);
    if (d < 0) return null;
    // Días recomendados de estudio (regla simple: ~2 bloques por día hasta el parcial).
    const suggested = Math.min(Math.max(d, 1), 7);
    return { subject: nextExam.subject, days: d, suggested };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextExam, today]);

  function exportCalendar() {
    if (upcoming.length === 0) return;
    downloadICS(
      "sereno-calendario",
      upcoming.map((e) => ({ title: `${typeEmoji(e.type)} ${e.subject}`, date: e.date, durationMin: 120, description: "Sereno" }))
    );
    notify("success", t.ui.exportedCal);
  }

  // ---- Construcción de la grilla del mes ----
  const grid = useMemo(() => {
    if (!cursor) return [];
    const first = new Date(cursor.y, cursor.m, 1);
    const startWeekday = (first.getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: ({ date: string; day: number } | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(cursor.m + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      cells.push({ date: `${cursor.y}-${mm}-${dd}`, day: d });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const monthName = cursor
    ? new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "";
  const weekdays = t.calendar.weekdays;

  function shiftMonth(delta: number) {
    setCursor((c) => {
      if (!c) return c;
      const nd = new Date(c.y, c.m + delta, 1);
      return { y: nd.getFullYear(), m: nd.getMonth() };
    });
  }

  const selectedEvents = selectedDay ? eventsByDay[selectedDay] ?? [] : [];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-nav">
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

      {/* Detector de sobrecarga */}
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
              overload.level === "high" ? "bg-danger/20 text-danger" : overload.level === "moderate" ? "bg-warn/20 text-warn" : "bg-calm/20 text-calm"
            )}
          >
            {overload.level === "high" ? <Flame className="h-5 w-5" /> : overload.level === "moderate" ? <Gauge className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {overload.level === "high" ? t.calendar.overloadHigh : overload.level === "moderate" ? t.calendar.overloadMid : t.calendar.overloadLow}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {t.calendar.overloadDetail.replace("{n}", String(overload.count14)).replace("{w}", String(overload.maxWeek))}
            </p>
            {overload.level !== "calm" && (
              <p className="mt-2 text-xs text-foreground/80">
                {overload.level === "high" ? t.calendar.overloadTipHigh : t.calendar.overloadTipMid}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Sugerencia inteligente de preparación */}
      {prepHint && prepHint.days >= 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-brand/10 p-4 ring-1 ring-brand/20">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <p className="text-sm text-foreground/85">
            {t.calendar.prepHint
              .replace("{s}", prepHint.subject)
              .replace("{d}", String(prepHint.days))
              .replace("{n}", String(prepHint.suggested))}
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        {/* Calendario mensual */}
        <div className="glass rounded-3xl p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => shiftMonth(-1)} className="glass flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/10" aria-label={t.calendar.prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-semibold capitalize">{monthName}</p>
            <button onClick={() => shiftMonth(1)} className="glass flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/10" aria-label={t.calendar.nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-muted">
            {weekdays.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell, i) => {
              if (!cell) return <div key={i} />;
              const evs = eventsByDay[cell.date] ?? [];
              const isToday = cell.date === today;
              const isPast = daysUntil(cell.date) < 0;
              const isSelected = cell.date === selectedDay;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedDay(cell.date);
                    if (!date) setDate(cell.date);
                  }}
                  className={cn(
                    "relative flex aspect-square min-h-[40px] flex-col items-center justify-center rounded-lg text-xs transition active:scale-95",
                    isSelected ? "bg-brand/25 ring-1 ring-brand/50" : "hover:bg-white/5",
                    isToday && !isSelected && "ring-1 ring-accent/50",
                    isPast && "opacity-40"
                  )}
                >
                  <span className={cn("font-medium", isToday && "text-accent")}>{cell.day}</span>
                  {evs.length > 0 && (
                    <span className="absolute bottom-1 flex gap-0.5">
                      {evs.slice(0, 3).map((e, j) => (
                        <span key={j} className={cn("h-1.5 w-1.5 rounded-full", TYPE_META[e.type ?? "exam"].dot)} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-muted">
            {(Object.keys(TYPE_META) as EventType[]).map((ty) => (
              <span key={ty} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", TYPE_META[ty].dot)} />
                {t.calendar.types[ty]}
              </span>
            ))}
          </div>
        </div>

        {/* Panel lateral: añadir + día seleccionado */}
        <div className="space-y-5 lg:col-span-2">
          {/* Añadir evento */}
          <div className="glass rounded-3xl p-5">
            <p className="mb-3 text-sm font-semibold">{t.calendar.addTitle}</p>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder={t.calendar.subjectPlaceholder}
              className="glass mb-2 w-full rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="glass mb-2 w-full rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 [color-scheme:dark]"
            />
            {/* Selector de tipo */}
            <div className="mb-3 grid grid-cols-4 gap-1">
              {(Object.keys(TYPE_META) as EventType[]).map((ty) => {
                const Icon = TYPE_META[ty].icon;
                return (
                  <button
                    key={ty}
                    onClick={() => setType(ty)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition",
                      type === ty ? TYPE_META[ty].chip : "glass text-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t.calendar.types[ty]}
                  </button>
                );
              })}
            </div>
            <button
              onClick={add}
              disabled={!subject.trim() || !date}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              {t.calendar.add}
            </button>
          </div>

          {/* Eventos del día seleccionado */}
          {selectedDay && (
            <div className="glass rounded-3xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">
                  {new Date(selectedDay + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <button onClick={() => setSelectedDay("")} className="text-muted transition hover:text-foreground" aria-label={t.common2.close}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-muted">{t.calendar.noEventsDay}</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((e) => {
                    const Icon = TYPE_META[e.type ?? "exam"].icon;
                    return (
                      <div key={e.id} className="group flex items-center gap-2 rounded-xl bg-white/[0.03] p-2.5">
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", TYPE_META[e.type ?? "exam"].chip)}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.subject}</span>
                        <button onClick={() => removeExamEvent(e.id)} aria-label={t.calendar.remove} className="text-muted opacity-0 transition hover:text-danger group-hover:opacity-100">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lista de próximos (cronológica, con countdown y tipo) */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted">{t.calendar.upcoming}</h2>
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
                const Icon = TYPE_META[e.type ?? "exam"].icon;
                return (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass group flex items-center gap-4 rounded-2xl p-4"
                  >
                    <div className={cn("flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl", urgent ? "bg-danger/20 text-danger" : soon ? "bg-warn/20 text-warn" : "bg-calm/20 text-calm")}>
                      <span className="text-xl font-extrabold leading-none">{n}</span>
                      <span className="text-[9px] uppercase">{n === 1 ? t.ui.day : t.ui.days}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate font-semibold">
                        <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded", TYPE_META[e.type ?? "exam"].chip)}>
                          <Icon className="h-3 w-3" />
                        </span>
                        {e.subject}
                      </p>
                      <p className="text-sm text-muted">
                        {new Date(e.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                      <p className={cn("mt-0.5 text-xs font-medium", urgent ? "text-danger" : soon ? "text-warn" : "text-calm")}>{countdownLabel(e.date)}</p>
                    </div>
                    <button onClick={() => removeExamEvent(e.id)} aria-label={t.calendar.remove} className="text-muted opacity-0 transition hover:text-danger group-hover:opacity-100">
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

function typeEmoji(type?: EventType): string {
  return type === "quiz" ? "📝" : type === "assignment" ? "📄" : type === "project" ? "📦" : "🎓";
}
