"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Mail,
  Loader2,
  Brain,
  Code2,
  ListChecks,
  CalendarClock,
  HeartHandshake,
  Compass,
  AlertTriangle,
  Clock,
  Target,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth, authErrorMessage } from "@/lib/auth-context";
import { UniandesMark } from "./ui/UniandesMark";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";

/** Página de bienvenida (landing) a pantalla completa, con login integrado.
 *  Se muestra mientras el usuario no ha entrado. */
export function Landing({ onGuest }: { onGuest: () => void }) {
  const { t } = useApp();
  const auth = useAuth();
  const L = t.landing;

  const [showEmail, setShowEmail] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function doGoogle() {
    setBusy(true);
    setError("");
    try {
      await auth.loginGoogle();
    } catch (e) {
      setError(authErrorMessage((e as { code?: string })?.code ?? ""));
    } finally {
      setBusy(false);
    }
  }

  async function doEmail() {
    if (!email.trim() || password.length < 6) return;
    setBusy(true);
    setError("");
    try {
      if (isRegister) await auth.registerEmail(name, email.trim(), password);
      else await auth.loginEmail(email.trim(), password);
    } catch (e) {
      setError(authErrorMessage((e as { code?: string })?.code ?? ""));
    } finally {
      setBusy(false);
    }
  }

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

  function scrollToAuth() {
    document.getElementById("sereno-auth")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="relative min-h-screen overflow-y-auto">
      <div className="aurora-bg" />

      {/* Barra superior */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent">
            <Brain className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">{t.brand}</span>
        </div>
        <div className="w-40">
          <LanguageSwitcher direction="down" />
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-2 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="glass glow-border inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-foreground/80">
            <UniandesMark className="h-4 w-4" />
            {L.badge}
          </span>
          <h1 className="mt-5 text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            {L.heroTitle} <span className="text-gradient">{L.heroAccent}</span>
          </h1>
          <p className="mt-5 max-w-lg text-pretty text-lg text-muted">{L.heroSubtitle}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={scrollToAuth}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-accent px-6 py-3 font-semibold text-white shadow-lg shadow-brand/25 transition hover:shadow-xl"
            >
              {L.ctaStart}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>

        {/* Tarjeta de login */}
        <motion.div
          id="sereno-auth"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="glass-strong glow-border mx-auto w-full max-w-md scroll-mt-6 rounded-3xl p-7"
        >
          <div className="mb-5 text-center">
            <h2 className="text-xl font-bold">{L.authTitle}</h2>
            <p className="mt-1 text-sm text-muted">{L.authSubtitle}</p>
          </div>

          {error && <p className="mb-4 rounded-xl bg-danger/15 px-3 py-2 text-sm text-danger">{error}</p>}

          {auth.enabled ? (
            <div className="space-y-3">
              <button
                onClick={doGoogle}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 font-semibold text-gray-800 transition hover:bg-gray-100 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
                {t.ui.loginGoogle}
              </button>

              <div className="flex items-center gap-3 py-1 text-xs text-muted">
                <span className="h-px flex-1 bg-white/10" />
                {t.ui.orEmail}
                <span className="h-px flex-1 bg-white/10" />
              </div>

              {!showEmail ? (
                <button
                  onClick={() => setShowEmail(true)}
                  className="glass flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition hover:bg-white/10"
                >
                  <Mail className="h-4 w-4" />
                  {t.ui.loginEmail}
                </button>
              ) : (
                <div className="space-y-3">
                  {isRegister && (
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.ui.namePlaceholder}
                      className="glass w-full rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
                      maxLength={40}
                    />
                  )}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.ui.emailLabel}
                    className="glass w-full rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doEmail()}
                    placeholder={t.ui.passwordLabel}
                    className="glass w-full rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                  <button
                    onClick={doEmail}
                    disabled={busy || !email.trim() || password.length < 6}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {isRegister ? t.ui.register : t.ui.enter}
                  </button>
                  <button onClick={() => setIsRegister((r) => !r)} className="w-full text-xs text-accent transition hover:underline">
                    {isRegister ? t.ui.haveAccount : t.ui.noAccount}
                  </button>
                </div>
              )}

              <button onClick={onGuest} className="block w-full pt-1 text-xs text-muted transition hover:text-foreground">
                {t.ui.continueGuest}
              </button>
            </div>
          ) : (
            // Sin Firebase: entrar con nombre
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (name.trim() ? onGuest() : null)}
                placeholder={t.ui.namePlaceholder}
                className="glass w-full rounded-xl px-4 py-3 text-center text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
                maxLength={40}
              />
              <button
                onClick={onGuest}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white transition hover:opacity-90"
              >
                {t.ui.enter}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>
      </section>

      {/* PROBLEMA */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-danger">{L.problemTag}</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{L.problemTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">{L.problemText}</p>
        </motion.div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {problems.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-3xl p-6"
              >
                <Icon className={`h-8 w-8 ${p.color}`} />
                <h3 className="mt-3 font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-muted">{p.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SOLUCIÓN */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-calm">{L.solutionTag}</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{L.solutionTitle}</h2>
        </motion.div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass flex items-start gap-3 rounded-2xl p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand/30 to-accent/30">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <p className="text-sm leading-relaxed text-foreground/85">{f.text}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={scrollToAuth}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-accent px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand/25 transition hover:shadow-xl"
          >
            {L.ctaStart}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-muted">{L.footer}</footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
