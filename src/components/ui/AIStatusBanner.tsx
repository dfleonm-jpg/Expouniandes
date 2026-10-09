"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, Loader2, X } from "lucide-react";
import { useApp } from "@/lib/app-context";

/**
 * Comprueba /api/health y muestra un aviso claro si la IA no está
 * configurada en el servidor (ej. falta GROQ_API_KEY en Vercel).
 */
export function AIStatusBanner() {
  const { t } = useApp();
  const [status, setStatus] = useState<"checking" | "ok" | "down">("checking");
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(async () => {
    setStatus("checking");
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      setStatus(data.ok ? "ok" : "down");
    } catch {
      setStatus("down");
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  if (status === "ok" || status === "checking" || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="mx-auto mb-4 max-w-4xl px-4"
      >
        <div className="glass flex items-start gap-3 rounded-2xl border border-warn/30 bg-warn/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
          <div className="flex-1">
            <p className="font-semibold text-foreground">{t.ui.aiNotConfiguredTitle}</p>
            <p className="mt-1 text-sm text-foreground/80">{t.ui.aiNotConfiguredBody}</p>
            <button
              onClick={check}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t.ui.checkAgain}
            </button>
          </div>
          <button onClick={() => setDismissed(true)} className="text-muted transition hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function AIStatusChecking() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <Loader2 className="h-3 w-3 animate-spin" /> …
    </span>
  );
}
