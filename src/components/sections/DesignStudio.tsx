"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Sparkles,
  Loader2,
  Eraser,
  Trash2,
  Undo2,
  Download,
  Wand2,
  Info,
  Lightbulb,
  Target,
  Check,
  Pencil,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import { cn } from "@/lib/utils";
import type { DesignFeedback } from "@/lib/types";

// Color de fondo del lienzo (claro, tipo papel, para que se vea bien dibujar).
const CANVAS_BG = "#f8fafc";

// Paleta de pinceles pensada para dibujar sobre fondo claro.
const COLORS = [
  "#0f172a", "#334155", "#3b6fe5", "#0ea5e9", "#14b8a6",
  "#f59e0b", "#ef4444", "#a855f7", "#ec4899", "#22c55e",
];
const SIZES = [2, 4, 8, 14, 24];

export function DesignStudio() {
  const { t, locale, addStat } = useApp();
  const fbReq = useAIRequest<DesignFeedback>();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const undoStack = useRef<string[]>([]);

  // Refs para leer los valores actuales dentro de los handlers de puntero.
  const colorRef = useRef("#0f172a");
  const sizeRef = useRef(4);
  const erasingRef = useRef(false);

  const [color, setColor] = useState("#0f172a");
  const [size, setSize] = useState(4);
  const [erasing, setErasing] = useState(false);
  const [discipline, setDiscipline] = useState("Diseño gráfico");
  const [brief, setBrief] = useState("");
  const [intent, setIntent] = useState("");
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { sizeRef.current = size; }, [size]);
  useEffect(() => { erasingRef.current = erasing; }, [erasing]);

  const DISCIPLINES = [
    t.designStudio.discGraphic,
    t.designStudio.discUxui,
    t.designStudio.discType,
    t.designStudio.discIllus,
    t.designStudio.discComp,
  ];

  // (Re)dimensiona el lienzo al tamaño real del contenedor, preservando el
  // dibujo. El buffer interno = tamaño CSS * devicePixelRatio para nitidez,
  // y el contexto se escala para trabajar siempre en coordenadas CSS.
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const cssW = Math.floor(parent.clientWidth);
    if (cssW <= 0) return; // aún oculto
    const cssH = Math.max(260, Math.min(Math.round(cssW * 0.6), 440));
    const ratio = window.devicePixelRatio || 1;

    // Si ya está al tamaño correcto, no re-inicializar (evita borrar).
    const targetW = Math.round(cssW * ratio);
    const targetH = Math.round(cssH * ratio);
    if (canvas.width === targetW && canvas.height === targetH && ctxRef.current) return;

    // Guarda el contenido actual para re-pintarlo tras el resize.
    let prev: HTMLCanvasElement | null = null;
    if (ctxRef.current && canvas.width > 0 && canvas.height > 0) {
      prev = document.createElement("canvas");
      prev.width = canvas.width;
      prev.height = canvas.height;
      prev.getContext("2d")?.drawImage(canvas, 0, 0);
    }

    canvas.width = targetW;
    canvas.height = targetH;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // coordenadas en CSS px
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, cssW, cssH);
    if (prev) ctx.drawImage(prev, 0, 0, prev.width, prev.height, 0, 0, cssW, cssH);
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    resize();
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    let ro: ResizeObserver | undefined;
    if (parent && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => resize());
      ro.observe(parent);
    }
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      ro?.disconnect();
    };
  }, [resize]);

  // Posición del puntero en coordenadas CSS del lienzo (coinciden con el ctx).
  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    // Escala por si el rect visual difiere del tamaño CSS declarado.
    const scaleX = (canvas.clientWidth || rect.width) / rect.width;
    const scaleY = (canvas.clientHeight || rect.height) / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function snapshot() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      undoStack.current.push(canvas.toDataURL("image/png"));
      if (undoStack.current.length > 20) undoStack.current.shift();
    } catch {
      /* ignore */
    }
  }

  function dot(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const s = erasingRef.current ? sizeRef.current * 2.5 : sizeRef.current;
    ctx.fillStyle = erasingRef.current ? CANVAS_BG : colorRef.current;
    ctx.beginPath();
    ctx.arc(x, y, s / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = ctxRef.current;
    if (!ctx) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    snapshot();
    drawingRef.current = true;
    const p = pointerPos(e);
    lastRef.current = p;
    dot(ctx, p.x, p.y); // punto al tocar (clics sueltos)
    if (!hasDrawn) setHasDrawn(true);
  }

  function moveDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = ctxRef.current;
    const last = lastRef.current;
    if (!ctx || !last) return;
    e.preventDefault();
    const p = pointerPos(e);
    ctx.strokeStyle = erasingRef.current ? CANVAS_BG : colorRef.current;
    ctx.lineWidth = erasingRef.current ? sizeRef.current * 2.5 : sizeRef.current;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
  }

  function endDraw() {
    drawingRef.current = false;
    lastRef.current = null;
  }

  function undo() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const prev = undoStack.current.pop();
    if (!canvas || !ctx) return;
    if (!prev) {
      clearCanvas(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
    };
    img.src = prev;
  }

  function clearCanvas(takeSnapshot = true) {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    if (takeSnapshot) snapshot();
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    setHasDrawn(false);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "sereno-boceto.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function askFeedback() {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const res = await fbReq.run(
      "/api/design-feedback",
      { image: dataUrl, brief, intent, discipline, locale },
      { timeoutMs: 75000 }
    );
    if (res) addStat("questionsAnswered", 1);
  }

  const fb = fbReq.data;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-nav">
      <SectionHeader icon={Palette} title={t.designStudio.title} subtitle={t.designStudio.subtitle} />

      {/* Aviso */}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-xs text-foreground/80 ring-1 ring-accent/20">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p>{t.designStudio.intro}</p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Lienzo + herramientas */}
        <div className="space-y-3">
          {/* Barra de herramientas */}
          <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setErasing(false); }}
                  aria-label={c}
                  className={cn(
                    "h-6 w-6 rounded-full ring-2 transition",
                    color === c && !erasing ? "ring-brand scale-110" : "ring-white/20 hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="h-5 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSize(s); setErasing(false); }}
                  aria-label={`${s}px`}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition",
                    size === s && !erasing ? "bg-brand/30 ring-1 ring-brand/50" : "hover:bg-white/5"
                  )}
                >
                  <span className="rounded-full bg-foreground" style={{ width: Math.min(s, 18), height: Math.min(s, 18) }} />
                </button>
              ))}
            </div>
            <div className="h-5 w-px bg-white/10" />
            <button
              onClick={() => setErasing((v) => !v)}
              className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition", erasing ? "bg-warn/20 text-warn ring-1 ring-warn/40" : "text-muted hover:bg-white/5")}
            >
              <Eraser className="h-4 w-4" /> {t.designStudio.eraser}
            </button>
            <button onClick={undo} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-white/5">
              <Undo2 className="h-4 w-4" /> {t.designStudio.undo}
            </button>
            <button onClick={() => clearCanvas()} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-white/5">
              <Trash2 className="h-4 w-4" /> {t.designStudio.clear}
            </button>
            <button onClick={download} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-white/5">
              <Download className="h-4 w-4" /> {t.designStudio.download}
            </button>
          </div>

          {/* Lienzo: el contenedor NO tiene padding para que el canvas ocupe
              exactamente su ancho (coordenadas del puntero precisas). */}
          <div className="glass relative overflow-hidden rounded-2xl">
            <canvas
              ref={canvasRef}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerCancel={endDraw}
              onPointerLeave={endDraw}
              className="block w-full cursor-crosshair touch-none select-none"
              style={{ height: 300, touchAction: "none" }}
            />
            {/* Pista visual de dónde dibujar (se oculta al empezar a trazar) */}
            {!hasDrawn && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                <Pencil className="h-8 w-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-500">{t.designStudio.canvasHint}</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel de brief + pedir retro */}
        <div className="space-y-3">
          <div className="glass rounded-2xl p-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{t.designStudio.disciplineLabel}</label>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {DISCIPLINES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDiscipline(d)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition",
                    discipline === d ? "bg-gradient-to-r from-brand to-brand-2 text-white" : "glass text-muted hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>

            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{t.designStudio.briefLabel}</label>
            <input
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={t.designStudio.briefPlaceholder}
              className="glass mb-3 w-full rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
            />

            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{t.designStudio.intentLabel}</label>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder={t.designStudio.intentPlaceholder}
              rows={3}
              className="glass w-full resize-y rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
            />

            <button
              onClick={askFeedback}
              disabled={!hasDrawn || fbReq.loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {fbReq.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {fbReq.loading ? t.designStudio.analyzing : t.designStudio.getFeedback}
            </button>
            {!hasDrawn && <p className="mt-2 text-center text-xs text-muted">{t.designStudio.drawFirst}</p>}
          </div>

          {/* Tips de diseño siempre visibles */}
          <div className="glass rounded-2xl p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-accent">
              <Lightbulb className="h-4 w-4" /> {t.designStudio.tipsTitle}
            </p>
            <ul className="space-y-1.5 text-xs text-foreground/80">
              {t.designStudio.tips.map((tip, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-brand">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {fbReq.error && (
        <div className="mt-4">
          <ErrorBanner message={fbReq.error} onRetry={askFeedback} onDismiss={() => fbReq.setError(null)} />
        </div>
      )}

      {/* Resultado de la retroalimentación */}
      <AnimatePresence>
        {fb && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 space-y-3"
          >
            {/* Veredicto + nota */}
            <div className="glass glow-border rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold", fb.score >= 3 ? "bg-calm/20 text-calm" : "bg-warn/20 text-warn")}>
                  {fb.score.toFixed(1)}
                </div>
                <div>
                  <p className="font-semibold">{fb.summary}</p>
                  {fb.reads && <p className="mt-1 text-sm text-muted">{fb.reads}</p>}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {/* Fortalezas */}
              {fb.strengths?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-calm">
                    <Check className="h-4 w-4" /> {t.designStudio.strengthsTitle}
                  </p>
                  <ul className="space-y-1 text-sm text-foreground/85">
                    {fb.strengths.map((s, i) => <li key={i}>✓ {s}</li>)}
                  </ul>
                </div>
              )}

              {/* Mejoras */}
              {fb.improvements?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-accent">
                    ⚡ {t.designStudio.improveTitle}
                  </p>
                  <div className="space-y-2">
                    {fb.improvements.map((im, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-semibold text-brand">{im.aspect}:</span>{" "}
                        <span className="text-foreground/85">{im.advice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reto siguiente */}
            {fb.nextChallenge && (
              <div className="glass rounded-2xl p-5">
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-warn">
                  <Target className="h-4 w-4" /> {t.designStudio.nextTitle}
                </p>
                <p className="text-sm text-foreground/85">{fb.nextChallenge}</p>
              </div>
            )}

            {/* Principios a repasar */}
            {fb.principles?.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground/90">
                  <Sparkles className="h-4 w-4 text-accent" /> {t.designStudio.principlesTitle}
                </p>
                <div className="flex flex-wrap gap-2">
                  {fb.principles.map((p, i) => (
                    <span key={i} className="rounded-full bg-brand/15 px-3 py-1 text-xs text-foreground/85 ring-1 ring-brand/25">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
