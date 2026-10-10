"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Accessibility, X, Type, Eye, Zap, BookA, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

/** Botón flotante + panel de accesibilidad (dislexia, tamaño, contraste, movimiento). */
export function AccessibilityButton() {
  const { t, a11y, setA11y } = useApp();
  const [open, setOpen] = useState(false);

  const Toggle = ({
    icon: Icon,
    label,
    value,
    onClick,
  }: {
    icon: typeof Eye;
    label: string;
    value: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      aria-pressed={value}
      className={cn(
        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition",
        value ? "bg-brand/20 text-brand ring-1 ring-brand/30" : "glass text-foreground/80 hover:bg-white/10"
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className={cn("h-5 w-9 rounded-full p-0.5 transition", value ? "bg-brand" : "bg-white/20")}>
        <span className={cn("block h-4 w-4 rounded-full bg-white transition", value && "translate-x-4")} />
      </span>
    </button>
  );

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t.ui.accessibility}
        className="glass-strong fixed bottom-24 left-4 z-[90] flex h-12 w-12 items-center justify-center rounded-full text-accent shadow-xl transition hover:scale-105 lg:bottom-6 lg:left-auto lg:right-6"
      >
        <Accessibility className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="glass-strong fixed bottom-0 right-0 top-0 z-[96] w-full max-w-sm overflow-y-auto p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Accessibility className="h-5 w-5 text-accent" />
                  {t.ui.accessibility}
                </h2>
                <button onClick={() => setOpen(false)} className="text-muted transition hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <Toggle
                  icon={BookA}
                  label={t.ui.a11yDyslexia}
                  value={a11y.dyslexia}
                  onClick={() => setA11y({ dyslexia: !a11y.dyslexia })}
                />

                {/* Tamaño de texto */}
                <div className="glass rounded-xl px-3 py-2.5">
                  <div className="mb-2 flex items-center justify-between text-sm text-foreground/80">
                    <span className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      {t.ui.a11yFontSize}
                    </span>
                    <span className="text-brand">{Math.round(a11y.fontScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.9}
                    max={1.4}
                    step={0.1}
                    value={a11y.fontScale}
                    onChange={(e) => setA11y({ fontScale: Number(e.target.value) })}
                    className="w-full accent-[var(--brand)]"
                  />
                </div>

                <Toggle
                  icon={Eye}
                  label={t.ui.a11yContrast}
                  value={a11y.highContrast}
                  onClick={() => setA11y({ highContrast: !a11y.highContrast })}
                />
                <Toggle
                  icon={Zap}
                  label={t.ui.a11yReduceMotion}
                  value={a11y.reduceMotion}
                  onClick={() => setA11y({ reduceMotion: !a11y.reduceMotion })}
                />

                <button
                  onClick={() => setA11y({ dyslexia: false, fontScale: 1, highContrast: false, reduceMotion: false })}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-medium transition hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.ui.a11yReset}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
