"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, GraduationCap, BookOpen, Brain, Plus, X, Check } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";
import { useModalA11y } from "@/lib/useModalA11y";
import { SerenoLogo } from "./SerenoLogo";
import { cn } from "@/lib/utils";

/** Cuestionario de 3 pasos que personaliza Sereno. Aparece una vez tras entrar. */
export function Onboarding() {
  const { t, profile, setProfile } = useApp();
  const { user, enabled } = useAuth();

  // Aparece solo si: hay sesión (o Firebase apagado) y aún no completó el perfil.
  // Se deriva del estado (no de un useState de una vez) para que reaccione si el
  // perfil llega/cambia por la sincronización con la nube. `dismissed` evita que
  // reaparezca tras pulsar Omitir/Finalizar en la misma sesión.
  const shouldShow = (enabled ? !!user : true) && !profile.completed;
  const [dismissed, setDismissed] = useState(false);
  const visible = shouldShow && !dismissed;
  const [step, setStep] = useState(0);
  const ref = useModalA11y(visible);

  // Estado local del formulario.
  const [career, setCareer] = useState(profile.career);
  const [semester, setSemester] = useState(profile.semester);
  const [university, setUniversity] = useState(profile.university || "Universidad de los Andes");
  const [subjects, setSubjects] = useState<string[]>(profile.subjects);
  const [subjectInput, setSubjectInput] = useState("");
  const [studyStyle, setStudyStyle] = useState(profile.studyStyle);
  const [stressLevel, setStressLevel] = useState(profile.stressLevel);

  // Al abrirse (incluido al reabrirlo desde "Editar mi perfil"), precarga el
  // formulario con lo que ya tenga el perfil y vuelve al primer paso.
  useEffect(() => {
    if (!visible) return;
    setCareer(profile.career);
    setSemester(profile.semester);
    setUniversity(profile.university || "Universidad de los Andes");
    setSubjects(profile.subjects);
    setStudyStyle(profile.studyStyle);
    setStressLevel(profile.stressLevel);
    setStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  function addSubject() {
    const s = subjectInput.trim();
    if (s && !subjects.includes(s)) setSubjects((p) => [...p, s]);
    setSubjectInput("");
  }

  function finish() {
    setProfile({ career, semester, university, subjects, studyStyle, stressLevel, completed: true });
    setDismissed(true);
  }

  function skip() {
    setProfile({ completed: true });
    setDismissed(true);
  }

  const steps = [t.ui.ob1Title, t.ui.ob2Title, t.ui.ob3Title];
  const canNext = step === 0 ? career.trim().length > 0 : true;

  const styleOptions = [
    { v: "visual", l: t.ui.obStyleVisual },
    { v: "practice", l: t.ui.obStylePractice },
    { v: "reading", l: t.ui.obStyleReading },
    { v: "explain", l: t.ui.obStyleExplain },
  ];
  const stressOptions = [
    { v: "low", l: t.ui.obStressLow, emoji: "😌" },
    { v: "mid", l: t.ui.obStressMid, emoji: "😅" },
    { v: "high", l: t.ui.obStressHigh, emoji: "😰" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[180] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={t.ui.obTitle}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass-strong glow-border relative w-full max-w-lg rounded-3xl p-7"
        >
          {/* Encabezado */}
          <div className="mb-5 flex items-center gap-3">
            <SerenoLogo className="h-11 w-11 shrink-0" />
            <div>
              <h2 className="text-lg font-bold leading-tight">{t.ui.obTitle}</h2>
              <p className="text-xs text-muted">
                {t.ui.obStep} {step + 1}/3 · {steps[step]}
              </p>
            </div>
          </div>

          {/* Progreso */}
          <div className="mb-6 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("h-1.5 flex-1 rounded-full transition", i <= step ? "bg-gradient-to-r from-brand to-accent" : "bg-white/10")} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* PASO 1: perfil */}
              {step === 0 && (
                <div className="space-y-4">
                  <Field icon={GraduationCap} label={t.ui.obCareer}>
                    <input value={career} onChange={(e) => setCareer(e.target.value)} placeholder={t.ui.obCareerPh} className={inputCls} autoFocus />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t.ui.obSemester}>
                      <select value={semester} onChange={(e) => setSemester(e.target.value)} className={cn(inputCls, "[color-scheme:dark]")}>
                        <option value="">—</option>
                        {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((s) => (
                          <option key={s} value={s}>{s}°</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t.ui.obUniversity}>
                      <input value={university} onChange={(e) => setUniversity(e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                </div>
              )}

              {/* PASO 2: materias */}
              {step === 1 && (
                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm text-muted">
                    <BookOpen className="h-4 w-4 text-accent" />
                    {t.ui.ob2Desc}
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
                      placeholder={t.ui.obSubjectPh}
                      className={inputCls}
                    />
                    <button onClick={addSubject} className="shrink-0 rounded-xl bg-gradient-to-r from-brand to-accent px-4 text-sm font-semibold text-white transition hover:opacity-90">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <span key={s} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm">
                        {s}
                        <button onClick={() => setSubjects((p) => p.filter((x) => x !== s))} className="text-muted hover:text-danger">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* PASO 3: estilo + estrés */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Brain className="h-4 w-4 text-accent" />
                      {t.ui.obStyle}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {styleOptions.map((o) => (
                        <button
                          key={o.v}
                          onClick={() => setStudyStyle(o.v)}
                          className={cn("rounded-xl px-3 py-2.5 text-left text-sm transition", studyStyle === o.v ? "bg-brand/20 text-brand ring-1 ring-brand/40" : "glass text-muted hover:text-foreground")}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">{t.ui.obStress}</p>
                    <div className="flex gap-2">
                      {stressOptions.map((o) => (
                        <button
                          key={o.v}
                          onClick={() => setStressLevel(o.v)}
                          className={cn("flex flex-1 flex-col items-center gap-1 rounded-xl py-3 text-xs transition", stressLevel === o.v ? "bg-brand/20 text-brand ring-1 ring-brand/40" : "glass text-muted hover:text-foreground")}
                        >
                          <span className="text-2xl">{o.emoji}</span>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navegación */}
          <div className="mt-7 flex items-center justify-between">
            {step > 0 ? (
              <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                {t.ui.obBack}
              </button>
            ) : (
              <button onClick={skip} className="text-sm text-muted transition hover:text-foreground">
                {t.ui.obSkip}
              </button>
            )}

            {step < 2 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {t.ui.obNext}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Check className="h-4 w-4" />
                {t.ui.obFinish}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const inputCls =
  "glass w-full rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50";

function Field({ icon: Icon, label, children }: { icon?: typeof GraduationCap; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground/80">
        {Icon && <Icon className="h-4 w-4 text-accent" />}
        {label}
      </label>
      {children}
    </div>
  );
}
