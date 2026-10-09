"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { useApp } from "@/lib/app-context";

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  const { t } = useApp();
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
      <p className="flex-1 text-sm text-foreground/90">{message}</p>
      <div className="flex shrink-0 gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium transition hover:bg-white/20"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t.errorBanner.retry}
          </button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="text-muted transition hover:text-foreground" aria-label={t.errorBanner.dismiss}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
