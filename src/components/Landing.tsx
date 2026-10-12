"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Code2,
  ListChecks,
  CalendarClock,
  HeartHandshake,
  Compass,
  AlertTriangle,
  Clock,
  Target,
  UserPlus,
  GraduationCap,
  Check,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { UniandesMark } from "./ui/UniandesMark";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";
import { AuthModal } from "./ui/AuthModal";

/** Página de bienvenida detallada. El login es obligatorio y se abre en un modal. */
export function Landing() {
  const { t } = useApp();
  const L = t.landing;
  const [authOpen, setAuthOpen] = useState(false);

  const problems = [
    { icon: AlertTriangle, title: L.problem1Title, text: L.problem1, color: "text-danger" },
    { icon: Clock, title: L.problem2Title, text: L.problem2, color: "text-warn" },
    { icon: Target, title: L.problem3Title, text: L.problem3, color: "text-accent" },
  ];

  const features = [
    { icon: Brain, text: L.f1 },
    { icon: Code2, text: L.f2 },
    { icon: ListChecks, text: L.f3 },
    { icon: CalendarClock, text: L.f4 },
    { icon: HeartHandshake, text: L.f5 },
    { icon: Compass, text: L.f6 },
  ];

  const steps = [
    { icon: UserPlus, title: L.step1Title, text: L.step1 },
    { icon: Compass, title: L.step2Title, text: L.step2 },
    { icon: Brain, title: L.step3Title, text: L.step3 },
    { icon: CalendarClock, title: L.step4Title, text: L.step4 },
  ];

  const forWho = [L.forWho1, L.forWho2, L.forWho3, L.forWho4];

  return (
    <div className="relative min-h-screen overflow-y-auto">
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Barra superior con botón iniciar sesión */}
      <header className="sticky top-0 z-40">
        <div className="glass-strong mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <UniandesMark className="h-9 w-9" />
            <span className="text-lg font-bold tracking-tight">{t.brand}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-36 sm:w-40">
              <LanguageSwitcher direction="down" />
            </div>
            <button
              onClick={() => setAuthOpen(true)}
              className="shine rounded-full bg-gradient-to-r from-brand to-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {L.signIn}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-4xl px-5 pt-14 pb-10 text-center sm:pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="pill-glow inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-foreground/80">
            <UniandesMark className="h-4 w-4" />
            {L.badge}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            {L.heroTitle} <span className="text-gradient">{L.heroAccent}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted sm:text-xl">{L.heroSubtitle}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setAuthOpen(true)}
              className="shine group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-accent px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand/30 transition hover:shadow-xl hover:shadow-brand/40"
            >
              {L.ctaStart}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
          </div>

          {/* Mini-stats */}
          <div className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4">
            {[
              { v: "15+", l: t.navGroups.learn + " +" },
              { v: "100%", l: L.statsFree },
              { v: "4", l: L.statsLangs },
            ].map((s, i) => (
              <div key={i} className="glass hover-lift rounded-2xl p-4">
                <p className="text-2xl font-extrabold text-gradient">{s.v}</p>
                <p className="mt-1 text-xs text-muted">{s.l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* PROBLEMA */}
      <Section>
        <Tag className="text-danger">{L.problemTag}</Tag>
        <Title>{L.problemTitle}</Title>
        <Lead>{L.problemText}</Lead>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {problems.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={i} delay={i * 0.1}>
                <div className="glass hover-lift h-full rounded-3xl p-6">
                  <Icon className={`h-8 w-8 ${p.color}`} />
                  <h3 className="mt-3 font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted">{p.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* SOLUCIÓN */}
      <Section>
        <Tag className="text-calm">{L.solutionTag}</Tag>
        <Title>{L.solutionTitle}</Title>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={i} delay={i * 0.06}>
                <div className="glass hover-lift flex h-full items-start gap-3 rounded-2xl p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand/30 to-accent/30">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85">{f.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* CÓMO FUNCIONA */}
      <Section>
        <Tag className="text-accent">{L.howTag}</Tag>
        <Title>{L.howTitle}</Title>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={i} delay={i * 0.08}>
                <div className="glass hover-lift relative h-full rounded-3xl p-6">
                  <span className="absolute right-5 top-5 text-3xl font-black text-white/5">{i + 1}</span>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent glow-ring">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* PARA QUIÉN */}
      <Section>
        <div className="glass glow-border rounded-3xl p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <Tag className="text-brand">{L.forWhoTag}</Tag>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{L.forWhoTitle}</h2>
              <ul className="mt-5 space-y-3">
                {forWho.map((w, i) => (
                  <li key={i} className="flex items-start gap-3 text-foreground/85">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-calm/20">
                      <Check className="h-3.5 w-3.5 text-calm" />
                    </span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <GraduationCap className="h-12 w-12 text-brand" />
                <UniandesMark className="h-20 w-20" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section>
        <div className="glass-strong glow-border rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{L.finalCtaTitle}</h2>
          <p className="mx-auto mt-3 max-w-md text-muted">{L.finalCtaText}</p>
          <button
            onClick={() => setAuthOpen(true)}
            className="shine group mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-accent px-8 py-4 font-semibold text-white shadow-lg shadow-brand/30 transition hover:shadow-xl hover:shadow-brand/40"
          >
            {L.ctaStart}
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </button>
        </div>
      </Section>

      <footer className="py-8 text-center text-sm text-muted">{L.footer}</footer>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-6xl px-5 py-12 text-center">{children}</section>;
}
function Tag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-sm font-semibold uppercase tracking-wider ${className}`}>{children}</span>;
}
function Title({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
    >
      {children}
    </motion.h2>
  );
}
function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mx-auto mt-4 max-w-2xl text-muted">{children}</p>;
}
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
