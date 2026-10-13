"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wand2, Loader2, RotateCcw, Clock3, Lightbulb, Download, Sparkles } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { downloadMarkdown } from "@/lib/export";
import { ErrorBanner } from "../ui/ErrorBanner";
import { cn } from "@/lib/utils";
import type { StudyPlan } from "@/lib/types";

type Intensity = "ligero" | "equilibrado" | "intensivo";

export function StudyPlanGenerator() {
  const { t, locale, profile, examEvents, mastery } = useApp();
  const { loading, error, data, run, reset, setError } = useAIRequest<StudyPlan>();

  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("equilibrado");
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [examDate, setExamDate] = useState("");

  // Materias sugeridas: las críticas del perfil + presets típicos de Uniandes.
  const presetSubjects = Array.from(
    new Set([
      ...(profile.subjects ?? []),
      "Programación (Python)",
      "Cálculo",
      "Física",
      "Álgebra lineal",
      "Estructuras de datos",
    ])
  ).slice(0, 8);

  // Próximos parciales del calendario (para fijar la fecha objetivo).
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingExams = examEvents.filter((e) => e.date >= todayStr).slice(0, 6);

  function daysUntil(d: string): number | undefined {
    if (!d) return undefined;
    const diff = Math.round((new Date(d + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 864e5);
    return diff >= 0 ? diff : undefined;
  }

  // Temas débiles del motor de dominio (dominio < 60), para priorizarlos.
  const weakLabels = Object.values(mastery.topics)
    .filter((m) => m.score < 60)
    .sort((a, b) => a.score - b.score)
    .map((m) => m.label)
    .slice(0, 6);

  async function generate() {
    if (!input.trim() && !subject) return;
    const effectiveInput = input.trim() || `Quiero prepararme para ${subject}.`;
    await run("/api/study-plan", {
      input: effectiveInput,
      locale,
      profile: profile.completed ? profile : undefined,
      options: {
        subject: subject || undefined,
        examDate: examDate || undefined,
        daysUntil: daysUntil(examDate),
        hoursPerDay,
        intensity,
        weakAreas: weakLabels.length ? weakLabels : undefined,
      },
    });
  }

  // Plan AUTOMÁTICO: usa el parcial más próximo del calendario y prioriza
  // automáticamente los temas débiles detectados, sin que el usuario escriba.
  async function generateAuto() {
    const nextExam = upcomingExams[0];
    if (!nextExam) return;
    const d = daysUntil(nextExam.date);
    const auto =
      `Prepárame para el parcial de ${nextExam.subject}` +
      (d !== undefined ? ` en ${d} días` : "") +
      (weakLabels.length ? `. Prioriza mis temas débiles: ${weakLabels.join(", ")}.` : ".");
    setSubject(nextExam.subject);
    setExamDate(nextExam.date);
    await run("/api/study-plan", {
      input: auto,
      locale,
      profile: profile.completed ? profile : undefined,
      options: {
        subject: nextExam.subject,
        examDate: nextExam.date,
        daysUntil: d,
        hoursPerDay,
        intensity,
        weakAreas: weakLabels.length ? weakLabels : undefined,
      },
    });
  }

  const intensities: { v: Intensity; l: string }[] = [
    { v: "ligero", l: t.studyPlan.intensityLight },
    { v: "equilibrado", l: t.studyPlan.intensityBalanced },
    { v: "intensivo", l: t.studyPlan.intensityIntense },
  ];

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Wand2 className="h-5 w-5 text-accent" />
        <h3 className="font-semibold">{t.studyPlan.title}</h3>
        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
          {t.studyPlan.personalized}
        </span>
      </div>

      {error && (
        <div className="mb-3">
          <ErrorBanner message={error} onRetry={generate} onDismiss={() => setError(null)} />
        </div>
      )}

      {!data ? (
        <div className="space-y-4">
          {/* Plan automático desde el próximo parcial + debilidades */}
          {upcomingExams.length > 0 && (
            <button
              onClick={generateAuto}
              disabled={loading}
              className="shine flex w-full items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand/10 px-4 py-3 text-left transition hover:bg-brand/15 disabled:opacity-50"
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 shrink-0 text-accent" />
                <span>
                  <span className="block text-sm font-semibold">{t.studyPlan.autoTitle}</span>
                  <span className="block text-xs text-muted">
                    {t.studyPlan.autoDesc.replace("{s}", upcomingExams[0].subject)}
                  </span>
                </span>
              </span>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 shrink-0 text-brand" />}
            </button>
          )}

          {/* Materia */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">{t.studyPlan.subjectLabel}</label>
            <div className="flex flex-wrap gap-2">
              {presetSubjects.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(subject === s ? "" : s)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    subject === s
                      ? "bg-gradient-to-r from-brand to-brand-2 text-white"
                      : "glass text-muted hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Objetivo / contexto libre */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.studyPlan.placeholder}
            rows={2}
            className="glass w-full resize-none rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Intensidad */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">{t.studyPlan.intensity}</label>
              <div className="glass inline-flex w-full rounded-xl p-0.5">
                {intensities.map((it) => (
                  <button
                    key={it.v}
                    onClick={() => setIntensity(it.v)}
                    className={cn(
                      "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition",
                      intensity === it.v ? "bg-gradient-to-r from-brand to-brand-2 text-white" : "text-muted hover:text-foreground"
                    )}
                  >
                    {it.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Horas por día */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                {t.studyPlan.hoursPerDay}: <span className="text-foreground">{hoursPerDay} h</span>
              </label>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                className="mt-2.5 w-full accent-[var(--brand)]"
              />
            </div>
          </div>

          {/* Fecha de parcial objetivo */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">{t.studyPlan.targetExam}</label>
            {upcomingExams.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {upcomingExams.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setExamDate(e.date);
                      if (!subject) setSubject(e.subject);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs transition",
                      examDate === e.date ? "bg-accent/20 text-accent ring-1 ring-accent/40" : "glass text-muted hover:text-foreground"
                    )}
                  >
                    {e.subject} · {daysUntil(e.date)}d
                  </button>
                ))}
              </div>
            )}
            <input
              type="date"
              value={examDate}
              min={todayStr}
              onChange={(e) => setExamDate(e.target.value)}
              className="glass w-full rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 [color-scheme:dark]"
            />
          </div>

          <button
            onClick={generate}
            disabled={(!input.trim() && !subject) || loading}
            className="shine flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
            {loading ? t.studyPlan.generating : t.studyPlan.generate}
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="mb-4 flex items-start gap-2 text-sm text-foreground/85">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            {data.summary}
          </p>
          <div className="space-y-3">
            {data.days?.map((day, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl bg-white/[0.03] p-4"
              >
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-brand">{day.day}</p>
                  <p className="text-xs text-muted">{day.focus}</p>
                </div>
                <ul className="space-y-1.5">
                  {day.sessions?.map((s, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-foreground/85">
                      <Clock3 className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span className="text-muted">{s.time}</span>
                      <span className="flex-1">{s.task}</span>
                      <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                        {s.durationMin} {t.studyPlan.min}
                      </span>
                    </li>
                  ))}
                </ul>
                {day.tip && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-calm">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {day.tip}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                if (!data) return;
                const md =
                  `# ${t.studyPlan.title}\n\n${data.summary}\n\n` +
                  data.days
                    .map(
                      (d) =>
                        `## ${d.day} — ${d.focus}\n` +
                        d.sessions.map((s) => `- **${s.time}** · ${s.task} (${s.durationMin} ${t.studyPlan.min})`).join("\n") +
                        (d.tip ? `\n\n> 💡 ${d.tip}` : "")
                    )
                    .join("\n\n");
                downloadMarkdown("plan-de-estudio", md);
              }}
              className="glass flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-white/10"
            >
              <Download className="h-4 w-4 text-accent" />
              {t.ui.exportMd}
            </button>
            <button
              onClick={() => {
                reset();
                setInput("");
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              {t.studyPlan.new}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
