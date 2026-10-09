"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check } from "lucide-react";
import { LOCALES } from "@/lib/i18n";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

/**
 * Selector de idioma.
 * - `direction="up"` abre el menú hacia arriba (para cuando está al pie del sidebar).
 * - `direction="down"` abre hacia abajo (barra superior móvil).
 */
export function LanguageSwitcher({ direction = "down" }: { direction?: "up" | "down" }) {
  const { locale, setLocale } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const up = direction === "up";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-foreground/90 transition hover:bg-white/10"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Cambiar idioma / Change language"
      >
        <Globe className="h-4 w-4 text-brand" />
        <span>{current?.flag}</span>
        <span>{current?.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: up ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: up ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "glass-strong absolute right-0 left-0 z-[80] overflow-hidden rounded-xl p-1 shadow-2xl",
              up ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            {LOCALES.map((l) => (
              <button
                key={l.code}
                role="option"
                aria-selected={l.code === locale}
                onClick={() => {
                  setLocale(l.code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/10",
                  l.code === locale ? "bg-white/5 text-brand" : "text-foreground/80"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{l.flag}</span>
                  {l.label}
                </span>
                {l.code === locale && <Check className="h-4 w-4" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
