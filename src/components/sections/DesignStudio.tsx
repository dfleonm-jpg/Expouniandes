"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, Sparkles, Loader2, Eraser, Trash2, Undo2, Download, Wand2,
  Info, Lightbulb, Target, Check, Pencil, ImagePlus, X, Square, Circle,
  Triangle, Star, Type, Minus, MousePointer2, Layers, Box, ChevronUp, ChevronDown,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useToast } from "../ui/Toast";
import { useAIRequest } from "@/lib/useAI";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import { cn } from "@/lib/utils";
import type { DesignFeedback } from "@/lib/types";
import {
  type DesignObject, type ShapeKind, type MaterialStyle, MATERIALS,
  renderObject, drawSelection, hitTest, newId,
} from "@/lib/design3d";

const CANVAS_BG = "#f8fafc";
const CANVAS_H = 380;
const MAX_UPLOAD = 25 * 1024 * 1024;

const COLORS = [
  "#0f172a", "#3b6fe5", "#0ea5e9", "#14b8a6", "#22c55e",
  "#f59e0b", "#ef4444", "#a855f7", "#ec4899", "#f8fafc",
];
const SIZES = [2, 4, 8, 14, 24];

type Mode = "draw" | "objects";
type Tool = "select" | ShapeKind;

export function DesignStudio() {
  const { t, locale, addStat } = useApp();
  const { notify } = useToast();
  const fbReq = useAIRequest<DesignFeedback>();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Capa de dibujo a mano (bitmap) y capa de objetos 3D (vectorial), compuestas.
  const strokeLayer = useRef<HTMLCanvasElement | null>(null); // trazos a mano
  const bgImageRef = useRef<HTMLImageElement | null>(null);    // diseño cargado
  const objectsRef = useRef<DesignObject[]>([]);               // objetos 3D

  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number; mode: "move" | "scale" } | null>(null);
  const undoStack = useRef<string[]>([]); // snapshots (objetos + trazos)

  const colorRef = useRef("#3b6fe5");
  const sizeRef = useRef(4);
  const erasingRef = useRef(false);
  const toolRef = useRef<Tool>("select");
  const modeRef = useRef<Mode>("objects");

  const [mode, setMode] = useState<Mode>("objects");
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#3b6fe5");
  const [size, setSize] = useState(4);
  const [erasing, setErasing] = useState(false);
  const [material, setMaterial] = useState<MaterialStyle>("glossy");
  const [depth, setDepth] = useState(14);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [objectsVersion, setObjectsVersion] = useState(0); // fuerza re-render del panel
  const [discipline, setDiscipline] = useState("Diseño gráfico");
  const [brief, setBrief] = useState("");
  const [intent, setIntent] = useState("");
  const [hasContent, setHasContent] = useState(false);
  const [uploadName, setUploadName] = useState<string | null>(null);

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { sizeRef.current = size; }, [size]);
  useEffect(() => { erasingRef.current = erasing; }, [erasing]);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const DISCIPLINES = [
    t.designStudio.discGraphic, t.designStudio.discUxui, t.designStudio.discType,
    t.designStudio.discIllus, t.designStudio.discComp,
  ];

  // ---------- COMPOSICIÓN / RENDER ----------
  function cssSize() {
    const c = canvasRef.current;
    return { w: c?.clientWidth || 0, h: c?.clientHeight || 0 };
  }

  // Redibuja TODO: fondo papel + imagen + trazos a mano + objetos 3D + selección.
  const compose = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, w, h);

    const img = bgImageRef.current;
    if (img && img.width) {
      const s = Math.min(w / img.width, h / img.height);
      const dw = img.width * s, dh = img.height * s;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }
    const sl = strokeLayer.current;
    if (sl) ctx.drawImage(sl, 0, 0, w, h);

    for (const o of objectsRef.current) renderObject(ctx, o);

    const sel = objectsRef.current.find((o) => o.id === selectedId);
    if (sel && modeRef.current === "objects") drawSelection(ctx, sel);
  }, [selectedId]);

  // Asegura la capa de trazos del tamaño correcto (en px CSS, escalada por DPR).
  function ensureStrokeLayer(w: number, h: number) {
    const ratio = window.devicePixelRatio || 1;
    let sl = strokeLayer.current;
    if (!sl) {
      sl = document.createElement("canvas");
      strokeLayer.current = sl;
    }
    const tw = Math.round(w * ratio), th = Math.round(h * ratio);
    if (sl.width !== tw || sl.height !== th) {
      // Preserva lo dibujado al reescalar.
      const old = document.createElement("canvas");
      old.width = sl.width; old.height = sl.height;
      if (sl.width) old.getContext("2d")?.drawImage(sl, 0, 0);
      sl.width = tw; sl.height = th;
      const sctx = sl.getContext("2d");
      if (sctx) {
        sctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        if (old.width) sctx.drawImage(old, 0, 0, old.width, old.height, 0, 0, w, h);
      }
    }
    return sl;
  }

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const cssW = Math.floor(parent.clientWidth);
    if (cssW <= 0) return;
    const cssH = CANVAS_H;
    const ratio = window.devicePixelRatio || 1;
    const targetW = Math.round(cssW * ratio), targetH = Math.round(cssH * ratio);
    if (canvas.width === targetW && canvas.height === targetH && ctxRef.current) return;
    canvas.width = targetW; canvas.height = targetH;
    canvas.style.width = `${cssW}px`; canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctxRef.current = ctx;
    ensureStrokeLayer(cssW, cssH);
    compose();
  }, [compose]);

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
    return () => { window.removeEventListener("resize", resize); ro?.disconnect(); };
  }, [resize]);

  useEffect(() => { compose(); }, [compose, objectsVersion]);

  // ---------- HISTORIAL ----------
  function snapshot() {
    try {
      const sl = strokeLayer.current;
      const snap = JSON.stringify({
        objects: objectsRef.current,
        strokes: sl ? sl.toDataURL("image/png") : null,
      });
      undoStack.current.push(snap);
      if (undoStack.current.length > 25) undoStack.current.shift();
    } catch { /* ignore */ }
  }
  function undo() {
    const snap = undoStack.current.pop();
    if (!snap) return;
    try {
      const data = JSON.parse(snap);
      objectsRef.current = data.objects || [];
      const { w, h } = cssSize();
      const sl = ensureStrokeLayer(w, h);
      const sctx = sl.getContext("2d");
      if (sctx) {
        sctx.clearRect(0, 0, w, h);
        if (data.strokes) {
          const im = new Image();
          im.onload = () => { sctx.drawImage(im, 0, 0, w, h); bump(); };
          im.src = data.strokes;
        }
      }
      setSelectedId(null);
      bump();
      setHasContent(objectsRef.current.length > 0 || !!bgImageRef.current || !!data.strokes);
    } catch { /* ignore */ }
  }
  function bump() { setObjectsVersion((v) => v + 1); }

  // ---------- PUNTERO ----------
  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const sx = (canvas.clientWidth || rect.width) / rect.width;
    const sy = (canvas.clientHeight || rect.height) / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    const p = pointerPos(e);

    if (modeRef.current === "draw") {
      const ctx = strokeLayer.current?.getContext("2d");
      if (!ctx) return;
      snapshot();
      drawingRef.current = true;
      lastRef.current = p;
      const s = erasingRef.current ? sizeRef.current * 2.5 : sizeRef.current;
      if (erasingRef.current) {
        ctx.save(); ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath(); ctx.arc(p.x, p.y, s / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else {
        ctx.fillStyle = colorRef.current;
        ctx.beginPath(); ctx.arc(p.x, p.y, s / 2, 0, Math.PI * 2); ctx.fill();
      }
      setHasContent(true);
      compose();
      return;
    }

    // Modo objetos
    const tl = toolRef.current;
    if (tl === "select") {
      // Buscar objeto bajo el puntero (de arriba a abajo).
      const list = objectsRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        if (hitTest(list[i], p.x, p.y)) {
          snapshot();
          setSelectedId(list[i].id);
          // ¿Tocó la manija de escala? (esquina inf-der aprox)
          const o = list[i];
          const handleDist = Math.hypot(p.x - (o.x + o.w / 2), p.y - (o.y + o.h / 2));
          dragRef.current = { id: o.id, dx: p.x - o.x, dy: p.y - o.y, mode: handleDist < 16 ? "scale" : "move" };
          bump();
          return;
        }
      }
      setSelectedId(null);
      bump();
      return;
    }

    // Crear una nueva forma/texto en el punto.
    snapshot();
    const obj = makeObject(tl, p.x, p.y);
    objectsRef.current = [...objectsRef.current, obj];
    setSelectedId(obj.id);
    setTool("select");
    setHasContent(true);
    bump();
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = pointerPos(e);
    if (modeRef.current === "draw") {
      if (!drawingRef.current) return;
      const ctx = strokeLayer.current?.getContext("2d");
      const last = lastRef.current;
      if (!ctx || !last) return;
      e.preventDefault();
      ctx.save();
      if (erasingRef.current) ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = erasingRef.current ? sizeRef.current * 2.5 : sizeRef.current;
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.restore();
      lastRef.current = p;
      compose();
      return;
    }
    const d = dragRef.current;
    if (!d) return;
    e.preventDefault();
    const list = objectsRef.current;
    const o = list.find((x) => x.id === d.id);
    if (!o) return;
    if (d.mode === "move") {
      o.x = p.x - d.dx; o.y = p.y - d.dy;
    } else {
      o.w = Math.max(16, (p.x - o.x) * 2);
      o.h = Math.max(16, (p.y - o.y) * 2);
    }
    compose();
  }

  function onPointerUp() {
    drawingRef.current = false;
    lastRef.current = null;
    dragRef.current = null;
    bump();
  }

  function makeObject(kind: ShapeKind, x: number, y: number): DesignObject {
    const base: DesignObject = {
      id: newId(), kind, x, y, w: 120, h: 120, rotation: 0,
      color: colorRef.current, style: material, depth,
    };
    if (kind === "circle") { base.w = 110; base.h = 110; }
    if (kind === "line") { base.w = 160; base.h = 10; base.thickness = 8; base.depth = 0; }
    if (kind === "text") { base.text = "Texto"; base.fontSize = 48; base.fontWeight = 800; base.w = 160; base.h = 56; }
    return base;
  }

  // ---------- EDICIÓN DEL OBJETO SELECCIONADO ----------
  const selected = objectsRef.current.find((o) => o.id === selectedId) || null;
  function updateSelected(patch: Partial<DesignObject>) {
    const o = objectsRef.current.find((x) => x.id === selectedId);
    if (!o) return;
    Object.assign(o, patch);
    bump();
  }
  function deleteSelected() {
    if (!selectedId) return;
    snapshot();
    objectsRef.current = objectsRef.current.filter((o) => o.id !== selectedId);
    setSelectedId(null);
    setHasContent(objectsRef.current.length > 0 || !!bgImageRef.current);
    bump();
  }
  function moveLayer(dir: 1 | -1) {
    const list = objectsRef.current;
    const i = list.findIndex((o) => o.id === selectedId);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    bump();
  }

  // ---------- SUBIR / LIMPIAR / DESCARGAR ----------
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify("error", t.designStudio.uploadOnlyImages); return; }
    if (file.size > MAX_UPLOAD) { notify("error", t.designStudio.uploadTooLarge); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        bgImageRef.current = img; setUploadName(file.name);
        setHasContent(true); compose(); notify("success", t.designStudio.uploadDone);
      };
      img.onerror = () => notify("error", t.designStudio.uploadFailed);
      img.src = reader.result as string;
    };
    reader.onerror = () => notify("error", t.designStudio.uploadFailed);
    reader.readAsDataURL(file);
  }
  function removeUpload() {
    bgImageRef.current = null; setUploadName(null);
    setHasContent(objectsRef.current.length > 0); compose();
  }
  function clearAll() {
    snapshot();
    objectsRef.current = [];
    const { w, h } = cssSize();
    const sl = ensureStrokeLayer(w, h);
    sl.getContext("2d")?.clearRect(0, 0, w, h);
    setSelectedId(null);
    setHasContent(!!bgImageRef.current);
    bump();
  }
  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prevSel = selectedId;
    setSelectedId(null);
    requestAnimationFrame(() => {
      compose();
      const link = document.createElement("a");
      link.download = "sereno-diseno.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      setSelectedId(prevSel);
    });
  }
  async function askFeedback() {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) return;
    const prevSel = selectedId;
    setSelectedId(null);
    // Espera un frame para que se componga sin el marco de selección.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    compose();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setSelectedId(prevSel);
    const res = await fbReq.run("/api/design-feedback",
      { image: dataUrl, brief, intent, discipline, locale }, { timeoutMs: 75000 });
    if (res) addStat("questionsAnswered", 1);
  }

  const fb = fbReq.data;

  const SHAPE_TOOLS: { tool: Tool; icon: typeof Square; label: string }[] = [
    { tool: "select", icon: MousePointer2, label: t.designStudio.toolSelect },
    { tool: "rect", icon: Square, label: t.designStudio.toolRect },
    { tool: "circle", icon: Circle, label: t.designStudio.toolCircle },
    { tool: "triangle", icon: Triangle, label: t.designStudio.toolTriangle },
    { tool: "star", icon: Star, label: t.designStudio.toolStar },
    { tool: "line", icon: Minus, label: t.designStudio.toolLine },
    { tool: "text", icon: Type, label: t.designStudio.toolText },
  ];
  const MATERIAL_LABELS: Record<MaterialStyle, string> = {
    soft: t.designStudio.matSoft, glossy: t.designStudio.matGlossy, metal: t.designStudio.matMetal,
    glass: t.designStudio.matGlass, neon: t.designStudio.matNeon, flat: t.designStudio.matFlat,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-nav">
      <SectionHeader icon={Palette} title={t.designStudio.title} subtitle={t.designStudio.subtitle} />

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-xs text-foreground/80 ring-1 ring-accent/20">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p>{t.designStudio.intro}</p>
      </div>

      {/* Selector de modo: Objetos 3D / Dibujar a mano */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => { setMode("objects"); setErasing(false); }}
          className={cn("flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
            mode === "objects" ? "bg-gradient-to-r from-brand to-accent text-white" : "glass text-muted hover:text-foreground")}
        >
          <Box className="h-4 w-4" /> {t.designStudio.mode3d}
        </button>
        <button
          onClick={() => { setMode("draw"); setTool("select"); }}
          className={cn("flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
            mode === "draw" ? "bg-gradient-to-r from-brand to-accent text-white" : "glass text-muted hover:text-foreground")}
        >
          <Pencil className="h-4 w-4" /> {t.designStudio.modeDraw}
        </button>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {/* Barra de herramientas */}
          <div className="glass flex flex-wrap items-center gap-2.5 rounded-2xl p-3">
            {mode === "objects" ? (
              <div className="flex flex-wrap items-center gap-1">
                {SHAPE_TOOLS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button key={s.tool} onClick={() => setTool(s.tool)} title={s.label}
                      className={cn("flex h-9 w-9 items-center justify-center rounded-lg transition",
                        tool === s.tool ? "bg-brand/30 text-brand ring-1 ring-brand/50" : "text-muted hover:bg-white/5")}>
                      <Icon className="h-4.5 w-4.5" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {SIZES.map((s) => (
                  <button key={s} onClick={() => { setSize(s); setErasing(false); }} aria-label={`${s}px`}
                    className={cn("flex h-7 w-7 items-center justify-center rounded-lg transition",
                      size === s && !erasing ? "bg-brand/30 ring-1 ring-brand/50" : "hover:bg-white/5")}>
                    <span className="rounded-full bg-foreground" style={{ width: Math.min(s, 18), height: Math.min(s, 18) }} />
                  </button>
                ))}
                <button onClick={() => setErasing((v) => !v)}
                  className={cn("ml-1 flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition",
                    erasing ? "bg-warn/20 text-warn ring-1 ring-warn/40" : "text-muted hover:bg-white/5")}>
                  <Eraser className="h-4 w-4" /> {t.designStudio.eraser}
                </button>
              </div>
            )}

            <div className="h-5 w-px bg-white/10" />
            <div className="flex flex-wrap items-center gap-1.5">
              {COLORS.map((c) => (
                <button key={c} onClick={() => { setColor(c); setErasing(false); if (selected) updateSelected({ color: c }); }}
                  aria-label={c}
                  className={cn("h-6 w-6 rounded-full ring-2 transition",
                    color === c ? "ring-brand scale-110" : "ring-white/20 hover:scale-105")}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={color}
                onChange={(e) => { setColor(e.target.value); if (selected) updateSelected({ color: e.target.value }); }}
                className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0" title={t.designStudio.customColor} />
            </div>

            <div className="h-5 w-px bg-white/10" />
            <button onClick={undo} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-white/5">
              <Undo2 className="h-4 w-4" /> {t.designStudio.undo}
            </button>
            <button onClick={clearAll} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-white/5">
              <Trash2 className="h-4 w-4" /> {t.designStudio.clear}
            </button>
            <button onClick={download} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-white/5">
              <Download className="h-4 w-4" /> {t.designStudio.download}
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-lg bg-brand/15 px-2.5 py-1 text-xs font-medium text-brand ring-1 ring-brand/30 transition hover:bg-brand/25">
              <ImagePlus className="h-4 w-4" /> {t.designStudio.upload}
            </button>
            <input ref={fileInputRef} type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.svg"
              onChange={handleUpload} className="hidden" />
          </div>

          {uploadName && (
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-xs text-foreground/80 ring-1 ring-white/10">
              <ImagePlus className="h-3.5 w-3.5 text-brand" />
              <span className="flex-1 truncate">{uploadName}</span>
              <button onClick={removeUpload} aria-label={t.designStudio.uploadRemove} className="text-muted transition hover:text-danger">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="glass relative overflow-hidden rounded-2xl">
            <canvas ref={canvasRef}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove}
              onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerLeave={onPointerUp}
              className={cn("block w-full touch-none select-none", mode === "draw" ? "cursor-crosshair" : tool === "select" ? "cursor-default" : "cursor-copy")}
              style={{ height: CANVAS_H, touchAction: "none" }} />
            {!hasContent && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center">
                <Box className="h-9 w-9 text-slate-400" />
                <p className="text-sm font-medium text-slate-500">{t.designStudio.canvasHint3d}</p>
                <p className="text-xs text-slate-400">{t.designStudio.canvasHint2}</p>
              </div>
            )}
          </div>

          {/* Editor del objeto seleccionado (estilo Illustrator) */}
          {mode === "objects" && selected && (
            <div className="glass space-y-3 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-brand">
                  <Box className="h-4 w-4" /> {t.designStudio.objectProps}
                </p>
                <button onClick={deleteSelected} className="flex items-center gap-1 text-xs text-muted transition hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" /> {t.designStudio.deleteObj}
                </button>
              </div>

              {/* Material */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">{t.designStudio.materialLabel}</label>
                <div className="flex flex-wrap gap-1.5">
                  {MATERIALS.map((m) => (
                    <button key={m} onClick={() => { setMaterial(m); updateSelected({ style: m }); }}
                      className={cn("rounded-full px-2.5 py-1 text-xs font-medium transition",
                        selected.style === m ? "bg-gradient-to-r from-brand to-brand-2 text-white" : "glass text-muted hover:text-foreground")}>
                      {MATERIAL_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profundidad 3D */}
              {selected.kind !== "line" && (
                <div>
                  <label className="mb-1 flex items-center justify-between text-xs font-medium text-muted">
                    <span>{t.designStudio.depthLabel}</span><span>{Math.round(selected.depth)}</span>
                  </label>
                  <input type="range" min={0} max={48} value={selected.depth}
                    onChange={(e) => { const d = Number(e.target.value); setDepth(d); updateSelected({ depth: d }); }}
                    className="w-full accent-brand" />
                </div>
              )}

              {/* Rotación */}
              <div>
                <label className="mb-1 flex items-center justify-between text-xs font-medium text-muted">
                  <span>{t.designStudio.rotateLabel}</span><span>{Math.round(selected.rotation)}°</span>
                </label>
                <input type="range" min={0} max={360} value={selected.rotation}
                  onChange={(e) => updateSelected({ rotation: Number(e.target.value) })} className="w-full accent-brand" />
              </div>

              {/* Texto editable */}
              {selected.kind === "text" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">{t.designStudio.textLabel}</label>
                  <input value={selected.text || ""} onChange={(e) => updateSelected({ text: e.target.value })}
                    className="glass w-full rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50" />
                </div>
              )}

              {/* Orden de capas */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-muted"><Layers className="h-3.5 w-3.5" /> {t.designStudio.layerLabel}</span>
                <button onClick={() => moveLayer(1)} className="glass flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition hover:bg-white/10">
                  <ChevronUp className="h-3.5 w-3.5" /> {t.designStudio.layerUp}
                </button>
                <button onClick={() => moveLayer(-1)} className="glass flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition hover:bg-white/10">
                  <ChevronDown className="h-3.5 w-3.5" /> {t.designStudio.layerDown}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho: brief + retro + tips */}
        <div className="space-y-3">
          <div className="glass rounded-2xl p-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{t.designStudio.disciplineLabel}</label>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {DISCIPLINES.map((d) => (
                <button key={d} onClick={() => setDiscipline(d)}
                  className={cn("rounded-full px-2.5 py-1 text-xs font-medium transition",
                    discipline === d ? "bg-gradient-to-r from-brand to-brand-2 text-white" : "glass text-muted hover:text-foreground")}>
                  {d}
                </button>
              ))}
            </div>

            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{t.designStudio.briefLabel}</label>
            <input value={brief} onChange={(e) => setBrief(e.target.value)} placeholder={t.designStudio.briefPlaceholder}
              className="glass mb-3 w-full rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50" />

            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{t.designStudio.intentLabel}</label>
            <textarea value={intent} onChange={(e) => setIntent(e.target.value)} placeholder={t.designStudio.intentPlaceholder} rows={3}
              className="glass w-full resize-y rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50" />

            <button onClick={askFeedback} disabled={!hasContent || fbReq.loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
              {fbReq.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {fbReq.loading ? t.designStudio.analyzing : t.designStudio.getFeedback}
            </button>
            {!hasContent && <p className="mt-2 text-center text-xs text-muted">{t.designStudio.drawFirst}</p>}
          </div>

          <div className="glass rounded-2xl p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-accent">
              <Lightbulb className="h-4 w-4" /> {t.designStudio.tipsTitle}
            </p>
            <ul className="space-y-1.5 text-xs text-foreground/80">
              {t.designStudio.tips.map((tip, i) => (
                <li key={i} className="flex gap-1.5"><span className="text-brand">•</span> {tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {fbReq.error && (
        <div className="mt-4"><ErrorBanner message={fbReq.error} onRetry={askFeedback} onDismiss={() => fbReq.setError(null)} /></div>
      )}

      <AnimatePresence>
        {fb && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-3">
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
              {fb.strengths?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-calm"><Check className="h-4 w-4" /> {t.designStudio.strengthsTitle}</p>
                  <ul className="space-y-1 text-sm text-foreground/85">{fb.strengths.map((s, i) => <li key={i}>✓ {s}</li>)}</ul>
                </div>
              )}
              {fb.improvements?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-accent">⚡ {t.designStudio.improveTitle}</p>
                  <div className="space-y-2">
                    {fb.improvements.map((im, i) => (
                      <div key={i} className="text-sm"><span className="font-semibold text-brand">{im.aspect}:</span> <span className="text-foreground/85">{im.advice}</span></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {fb.nextChallenge && (
              <div className="glass rounded-2xl p-5">
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-warn"><Target className="h-4 w-4" /> {t.designStudio.nextTitle}</p>
                <p className="text-sm text-foreground/85">{fb.nextChallenge}</p>
              </div>
            )}
            {fb.principles?.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground/90"><Sparkles className="h-4 w-4 text-accent" /> {t.designStudio.principlesTitle}</p>
                <div className="flex flex-wrap gap-2">
                  {fb.principles.map((p, i) => <span key={i} className="rounded-full bg-brand/15 px-3 py-1 text-xs text-foreground/85 ring-1 ring-brand/25">{p}</span>)}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
