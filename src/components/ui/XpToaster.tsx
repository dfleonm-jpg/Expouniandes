"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";
import { onXp, type XpEvent } from "@/lib/xp-events";

type Pop = XpEvent & { id: string };

/**
 * Muestra una píldora animada "+N XP" (y "¡Subiste al nivel X!") cada vez
 * que el usuario gana puntos. Vive junto al ToastProvider en el layout.
 * Agrupa ganancias muy seguidas para no saturar la pantalla.
 */
export function XpToaster() {
  const [pops, setPops] = useState<Pop[]>([]);

  useEffect(() => {
    return onXp((e) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setPops((prev) => [...prev.slice(-2), { ...e, id }]);
      const timeout = e.leveledUp ? 4000 : 2600;
      setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== id)), timeout);
    });
  }, []);

  return (
    <div className="safe-top pointer-events-none fixed inset-x-0 top-20 z-[110] flex flex-col items-center gap-2">
      <AnimatePresence>
        {pops.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: -16, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className={`glass-strong flex items-center gap-2 rounded-full px-4 py-2 shadow-2xl ${
              p.leveledUp ? "border border-brand/50" : ""
            }`}
          >
            {p.leveledUp ? (
              <>
                <TrendingUp className="h-4 w-4 text-brand" />
                <span className="text-sm font-bold text-foreground">
                  ¡Subiste al nivel {p.level}! +{p.gained} XP
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">+{p.gained} XP</span>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
