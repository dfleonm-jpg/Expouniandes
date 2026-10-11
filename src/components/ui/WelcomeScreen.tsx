"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Loader2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth, authErrorMessage } from "@/lib/auth-context";
import { UniandesMark } from "./UniandesMark";
import { LanguageSwitcher } from "./LanguageSwitcher";

/** Pantalla de bienvenida con login (Google / correo) si Firebase está activo,
 *  o modo "solo nombre" como respaldo. */
export function WelcomeScreen() {
  const { t, userName, setUserName } = useApp();
  const auth = useAuth();

  const [name, setName] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Si Firebase está activo: mostrar hasta que haya sesión. Si no: hasta que ponga nombre.
  const show = auth.enabled
    ? !auth.loading && !auth.user && !dismissed
    : !userName && !dismissed;

  function submitName() {
    const clean = name.trim();
    if (clean) setUserName(clean);
    setDismissed(true);
  }

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

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          <div className="aurora-bg" />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className="glass-strong glow-border relative w-full max-w-md rounded-3xl p-8 text-center"
          >
            <div className="absolute right-4 top-4">
              <LanguageSwitcher direction="down" />
            </div>

            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.1, damping: 12 }}
              className="mx-auto mb-5 mt-4 flex h-20 w-20 items-center justify-center"
            >
              <UniandesMark className="h-20 w-20" />
            </motion.div>

            <h1 className="text-2xl font-extrabold tracking-tight">{t.ui.welcomeTitle}</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted">{t.ui.welcomeSubtitle}</p>

            {error && (
              <p className="mt-4 rounded-xl bg-danger/15 px-3 py-2 text-sm text-danger">{error}</p>
            )}

            {/* --- MODO CON LOGIN (Firebase activo) --- */}
            {auth.enabled ? (
              <div className="mt-7 space-y-3">
                {!showEmail ? (
                  <>
                    <button
                      onClick={doGoogle}
                      disabled={busy}
                      className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 font-semibold text-gray-800 transition hover:bg-gray-100 disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
                      {t.ui.loginGoogle}
                    </button>
                    <button
                      onClick={() => {
                        setShowEmail(true);
                        setError("");
                      }}
                      className="glass flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-foreground transition hover:bg-white/10"
                    >
                      <Mail className="h-4 w-4" />
                      {t.ui.loginEmail}
                    </button>
                  </>
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
                    <button
                      onClick={() => {
                        setIsRegister((r) => !r);
                        setError("");
                      }}
                      className="text-xs text-accent transition hover:underline"
                    >
                      {isRegister ? t.ui.haveAccount : t.ui.noAccount}
                    </button>
                  </div>
                )}
                <button onClick={() => setDismissed(true)} className="block w-full text-xs text-muted transition hover:text-foreground">
                  {t.ui.continueGuest}
                </button>
              </div>
            ) : (
              /* --- MODO SOLO NOMBRE (sin Firebase) --- */
              <div className="mt-7 space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitName()}
                  placeholder={t.ui.namePlaceholder}
                  className="glass w-full rounded-xl px-4 py-3 text-center text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
                  autoFocus
                  maxLength={40}
                />
                <button
                  onClick={submitName}
                  disabled={!name.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                >
                  {t.ui.enter}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => setDismissed(true)} className="text-xs text-muted transition hover:text-foreground">
                  {t.ui.skip}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
