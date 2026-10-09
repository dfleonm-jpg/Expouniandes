"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { UniandesMark } from "./UniandesMark";
import { LanguageSwitcher } from "./LanguageSwitcher";

/** Pantalla de bienvenida (onboarding) con branding Uniandes.
 *  Aparece solo si el usuario aún no ha puesto su nombre. */
export function WelcomeScreen() {
  const { t, userName, setUserName } = useApp();
  const [name, setName] = useState("");
  const [dismissed, setDismissed] = useState(false);

  const show = !userName && !dismissed;

  function submit() {
    const clean = name.trim();
    if (clean) setUserName(clean);
    setDismissed(true);
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
          {/* Fondo */}
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

            <h1 className="text-2xl font-extrabold tracking-tight">
              {t.ui.welcomeTitle}
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted">{t.ui.welcomeSubtitle}</p>

            <div className="mt-7 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={t.ui.namePlaceholder}
                className="glass w-full rounded-xl px-4 py-3 text-center text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
                autoFocus
                maxLength={40}
              />
              <button
                onClick={submit}
                disabled={!name.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand/25 transition hover:shadow-xl disabled:opacity-40"
              >
                {t.ui.enter}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-xs text-muted transition hover:text-foreground"
              >
                {t.ui.skip}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
