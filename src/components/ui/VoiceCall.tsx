"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, PhoneOff, Volume2, Brain } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SerenoLogo } from "./SerenoLogo";
import { cn } from "@/lib/utils";

export type CallStatus = "listening" | "thinking" | "speaking" | "idle";

/**
 * Pantalla de "llamada" con la IA: un orbe central animado que reacciona al
 * estado (escuchando / pensando / hablando), con un transcripto breve.
 */
export function VoiceCall({
  open,
  status,
  transcript,
  onTap,
  onEnd,
}: {
  open: boolean;
  status: CallStatus;
  transcript?: string;
  onTap: () => void;
  onEnd: () => void;
}) {
  const { t } = useApp();

  const label =
    status === "speaking" ? t.ui.voiceSpeaking
      : status === "thinking" ? t.ui.voiceThinking
        : status === "listening" ? t.ui.voiceListening
          : t.ui.voiceTapToTalk;

  // Pista contextual bajo el estado.
  const hint =
    status === "speaking" || status === "thinking" ? t.ui.voiceInterrupt
      : status === "idle" ? t.ui.voiceTapToTalk
        : "";

  // Color/intensidad del aura según el estado.
  const aura =
    status === "speaking" ? "from-brand/60 to-accent/30"
      : status === "listening" ? "from-calm/50 to-brand/30"
        : status === "thinking" ? "from-warn/40 to-brand/20"
          : "from-white/20 to-white/5";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-[rgba(2,3,3,0.92)] backdrop-blur-xl"
        >
          {/* Título */}
          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-[12%] flex flex-col items-center gap-2 text-center"
          >
            <span className="text-xs uppercase tracking-[0.3em] text-muted">{t.brand}</span>
            <span className="text-sm text-foreground/70">{t.ui.voiceCall}</span>
          </motion.div>

          {/* Orbe central */}
          <div className="relative flex items-center justify-center">
            {/* Anillos que laten según el estado */}
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className={cn("absolute rounded-full bg-gradient-to-br", aura)}
                style={{ width: 220, height: 220 }}
                animate={
                  status === "idle"
                    ? { scale: 1, opacity: 0.25 }
                    : { scale: [1, 1.35 + i * 0.12, 1], opacity: [0.35, 0, 0.35] }
                }
                transition={{
                  duration: status === "speaking" ? 1.6 : status === "listening" ? 2 : 2.6,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Núcleo — siempre tocable (permite interrumpir a la IA) */}
            <motion.button
              onClick={onTap}
              className={cn(
                "relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl",
                aura
              )}
              animate={{ scale: status === "speaking" ? [1, 1.06, 1] : status === "listening" ? [1, 1.03, 1] : 1 }}
              transition={{ duration: 1.2, repeat: status === "idle" ? 0 : Infinity, ease: "easeInOut" }}
              aria-label={label}
            >
              <span className="flex h-28 w-28 items-center justify-center rounded-full bg-[rgba(9,10,12,0.85)] ring-1 ring-white/10">
                <SerenoLogo className="h-16 w-16" />
              </span>
            </motion.button>
          </div>

          {/* Estado */}
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 flex items-center gap-2 text-sm font-medium text-foreground/90"
          >
            {status === "speaking" ? <Volume2 className="h-4 w-4 animate-pulse text-brand" />
              : status === "thinking" ? <Brain className="h-4 w-4 animate-pulse text-warn" />
                : <Mic className={cn("h-4 w-4", status === "listening" && "animate-pulse text-calm")} />}
            {label}
          </motion.div>

          {/* Pista contextual (interrumpir / tocar para hablar) */}
          {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}

          {/* Transcripto breve de lo último que dijiste */}
          {transcript && (
            <p className="mt-3 max-w-md px-6 text-center text-sm text-muted">“{transcript}”</p>
          )}

          {/* Colgar */}
          <button
            onClick={onEnd}
            className="absolute bottom-[12%] flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white shadow-xl transition hover:scale-105 active:scale-95"
            aria-label={t.ui.voiceEnd}
          >
            <PhoneOff className="h-7 w-7" />
          </button>
          <span className="absolute bottom-[8%] text-xs text-muted">{t.ui.voiceEnd}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
