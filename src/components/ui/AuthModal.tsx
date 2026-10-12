"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth, authErrorMessage } from "@/lib/auth-context";
import { useModalA11y } from "@/lib/useModalA11y";
import { UniandesMark } from "./UniandesMark";

/** Modal de inicio de sesión (Google + correo/contraseña + registro). */
export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useApp();
  const auth = useAuth();
  const L = t.landing;
  const C = t.common2;
  const ref = useModalA11y(open, onClose);

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function toggleMode() {
    setIsRegister((r) => !r);
    setError("");
    setInfo("");
  }

  async function doGoogle() {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await auth.loginGoogle();
      onClose();
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
    setInfo("");
    try {
      if (isRegister) await auth.registerEmail(name, email.trim(), password);
      else await auth.loginEmail(email.trim(), password);
      onClose();
    } catch (e) {
      setError(authErrorMessage((e as { code?: string })?.code ?? ""));
    } finally {
      setBusy(false);
    }
  }

  async function doReset() {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError(C.resetEnterEmail);
      return;
    }
    setBusy(true);
    try {
      await auth.resetPassword(email.trim());
      setInfo(C.resetSent);
    } catch (e) {
      setError(authErrorMessage((e as { code?: string })?.code ?? ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={isRegister ? t.ui.register : L.authTitle}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 240 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong glow-border relative w-full max-w-md rounded-3xl p-7"
          >
            <button onClick={onClose} className="absolute right-4 top-4 text-muted transition hover:text-foreground" aria-label={C.close}>
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 text-center">
              <div className="glow-ring mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-accent/20">
                <UniandesMark className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-bold">{isRegister ? t.ui.register : L.authTitle}</h2>
              <p className="mt-1 text-sm text-muted">{L.authSubtitle}</p>
            </div>

            {error && <p className="mb-4 rounded-xl bg-danger/15 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
            {info && <p className="mb-4 rounded-xl bg-calm/15 px-3 py-2 text-sm text-calm" role="status">{info}</p>}

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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doEmail()}
                    placeholder={t.ui.passwordLabel}
                    className="glass w-full rounded-xl px-4 py-3 pr-11 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? C.hidePassword : C.showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {(isRegister || (password.length > 0 && password.length < 6)) && (
                  <p className="px-1 text-xs text-muted">{C.passwordHint}</p>
                )}
                <button
                  onClick={doEmail}
                  disabled={busy || !email.trim() || password.length < 6}
                  className="shine flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {isRegister ? t.ui.register : t.ui.loginEmail}
                </button>
                {!isRegister && (
                  <button onClick={doReset} disabled={busy} className="w-full text-xs text-muted transition hover:text-foreground hover:underline disabled:opacity-50">
                    {C.forgotPassword}
                  </button>
                )}
                <button onClick={toggleMode} className="w-full text-xs text-accent transition hover:underline">
                  {isRegister ? t.ui.haveAccount : t.ui.noAccount}
                </button>
              </div>
            ) : (
              <p className="rounded-xl bg-warn/15 p-4 text-center text-sm text-warn">
                {L.authSubtitle}
              </p>
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
