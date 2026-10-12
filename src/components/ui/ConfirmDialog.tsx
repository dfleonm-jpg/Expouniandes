"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useModalA11y } from "@/lib/useModalA11y";

/**
 * Diálogo de confirmación reutilizable, accesible y acorde a la estética
 * de la app (reemplaza al `confirm()` nativo del navegador).
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useApp();
  const ref = useModalA11y(open, onCancel);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong glow-border relative w-full max-w-sm rounded-3xl p-6"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? "bg-danger/15" : "bg-brand/15"}`}>
                <AlertTriangle className={`h-5 w-5 ${danger ? "text-danger" : "text-brand"}`} />
              </div>
              <div>
                <h2 className="font-bold text-foreground">{title}</h2>
                {body && <p className="mt-1 text-sm text-muted">{body}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="glass flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-white/10"
              >
                {cancelLabel ?? t.common2.cancel}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 ${
                  danger ? "bg-gradient-to-r from-warn to-danger" : "bg-gradient-to-r from-brand to-accent"
                }`}
              >
                {confirmLabel ?? t.common2.confirm}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
