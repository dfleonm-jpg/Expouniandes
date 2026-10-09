"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check } from "lucide-react";
import { LOCALES } from "@/lib/i18n";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass flex items-center gap-2 rounded-full px-3 py-2 text-sm text-foreground/90 transition hover:bg-white/10"
        aria-label="Cambiar idioma"
      >
        <Globe className="h-4 w-4 text-brand" />
        <span className="hidden sm:inline">{current?.flag}</span>
        <span className="hidden md:inline">{current?.label}</span>
        <span className="sm:hidden">{current?.flag}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="glass-strong absolute right-0 mt-2 w-44 overflow-hidden rounded-xl p-1 shadow-2xl"
          >
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLocale(l.code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-white/10",
                  l.code === locale ? "text-brand" : "text-foreground/80"
                )}
              >
                <span className="flex items-center gap-2">
                  <span>{l.flag}</span>
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
