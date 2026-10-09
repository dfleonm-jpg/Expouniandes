"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { useApp } from "@/lib/app-context";

/**
 * Comprueba /api/health y SOLO avisa si la IA de verdad no está configurada
 * en el servidor (falta la clave). Se revisa automáticamente cada cierto
 * tiempo y se oculta solo en cuanto la IA vuelve a estar lista, para no
 * dejar un aviso "pegado" después de un redeploy o un corte momentáneo.
 */
export function AIStatusBanner() {
  const { t } = useApp();
  const [configured, setConfigured] = useState<boolean | null>(null); // null = aún comprobando
  const [dismissed, setDismissed] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      // Solo nos importa si la CLAVE está configurada en el servidor.
      const ok = Boolean(data?.configured?.groq || data?.configured?.gemini);
      setConfigured(ok);
      if (ok) setDismissed(false); // si se recupera, el banner podrá volver a mostrarse si hiciera falta
    } catch {
      // Error de red puntual: no afirmamos que esté mal configurada.
      setConfigured((prev) => (prev === null ? null : prev));
    }
  }, []);

  useEffect(() => {
    check();
    // Re-comprueba cada 20s para auto-recuperarse tras un redeploy.
    timer.current = setInterval(check, 20000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [check]);

  // Solo mostramos el aviso si confirmamos que NO hay clave configurada.
  if (configured !== false || dismissed) return null;

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
