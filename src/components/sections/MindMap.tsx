"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Sparkles, Loader2, RotateCcw, ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { useToast } from "../ui/Toast";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import type { MindMap as MindMapType } from "@/lib/types";

const COLORS = [
  { from: "#8b5cf6", to: "#6366f1" },
  { from: "#22d3ee", to: "#3b82f6" },
  { from: "#34d399", to: "#14b8a6" },
  { from: "#fbbf24", to: "#f97316" },
  { from: "#fb7185", to: "#ec4899" },
  { from: "#c084fc", to: "#a855f7" },
  { from: "#38bdf8", to: "#0ea5e9" },
];

export function MindMap() {
  const { t, locale } = useApp();
  const { notify } = useToast();
  const { loading, error, data, run, reset, setError } = useAIRequest<MindMapType>();
  const [topic, setTopic] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [zoom, setZoom] = useState(1);
  const svgWrapRef = useRef<HTMLDivElement>(null);

  async function generate(tp?: string) {
    const topicToUse = (tp ?? topic).trim();
    if (!topicToUse) return;
    setExpanded(new Set());
    setZoom(1);
    const res = await run("/api/mindmap", { topic: topicToUse, locale });
    if (res?.branches) setExpanded(new Set(res.branches.map((_, i) => i))); // abiertas por defecto
  }

  function toggle(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  // Geometría del mapa radial.
  const W = 1100;
  const H = 760;
  const cx = W / 2;
  const cy = H / 2;

  const layout = useMemo(() => {
    if (!data?.branches) return [];
    const n = data.branches.length;
    const radius = 230;
    return data.branches.map((b, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const bx = cx + Math.cos(angle) * radius;
      const by = cy + Math.sin(angle) * radius;
      const onRight = Math.cos(angle) >= 0;
      return { branch: b, i, bx, by, angle, onRight };
    });
  }, [data, cx, cy]);

  async function exportImage() {
    const svg = svgWrapRef.current?.querySelector("svg");
    if (!svg) return;
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("width", String(W));
      clone.setAttribute("height", String(H));
      const xml = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = W * 2;
      canvas.height = H * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#07070b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `mapa-${(data?.central ?? "sereno").slice(0, 30)}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      notify("success", t.ui.exported);
    } catch {
      notify("error", t.common.error);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={Network} title={t.mindmap.title} subtitle={t.mindmap.subtitle} />

      <div className="mt-6 space-y-4">
        {error && <ErrorBanner message={error} onRetry={() => generate()} onDismiss={() => setError(null)} />}

        {!data ? (
          <div className="glass rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder={t.mindmap.placeholder}
                className="glass flex-1 rounded-xl px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
              <button
                onClick={() => generate()}
                disabled={!topic.trim() || loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {loading ? t.mindmap.generating : t.mindmap.generate}
              </button>
            </div>
            {/* Ejemplos rápidos */}
            <div className="mt-4 flex flex-wrap gap-2">
              {t.mindmap.examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setTopic(ex);
                    generate(ex);
                  }}
                  className="glass rounded-full px-3 py-1.5 text-xs text-foreground/80 transition hover:bg-white/10"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Barra de herramientas */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ToolBtn onClick={() => setZoom((z) => Math.min(z + 0.15, 2))} title={t.mindmap.zoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))} title={t.mindmap.zoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn onClick={() => setZoom(1)} title={t.mindmap.resetView}>
                  <Maximize2 className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                  onClick={() => setExpanded(new Set(data.branches.map((_, i) => i)))}
                  title={t.mindmap.expandAll}
                >
                  <span className="text-xs font-medium">{t.mindmap.expandAll}</span>
                </ToolBtn>
                <ToolBtn onClick={() => setExpanded(new Set())} title={t.mindmap.collapseAll}>
                  <span className="text-xs font-medium">{t.mindmap.collapseAll}</span>
                </ToolBtn>
              </div>
              <div className="flex items-center gap-1.5">
                <ToolBtn onClick={exportImage} title={t.mindmap.exportImg}>
                  <Download className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                  onClick={() => {
                    reset();
                    setTopic("");
                  }}
                  title={t.mindmap.new}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="ml-1 text-xs font-medium">{t.mindmap.new}</span>
                </ToolBtn>
              </div>
            </div>

            {/* Lienzo del mapa */}
            <div
              ref={svgWrapRef}
              className="glass overflow-auto rounded-3xl p-2"
              style={{ maxHeight: "70vh" }}
            >
              <svg
                viewBox={`0 0 ${W} ${H}`}
                width={W * zoom}
                height={H * zoom}
                className="mx-auto block"
                style={{ minWidth: "100%" }}
              >
                <defs>
                  {COLORS.map((c, i) => (
                    <linearGradient key={i} id={`mm-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={c.from} />
                      <stop offset="100%" stopColor={c.to} />
                    </linearGradient>
                  ))}
                  <radialGradient id="mm-center" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </radialGradient>
                  <filter id="mm-glow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="6" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Conectores curvos central -> ramas */}
                {layout.map(({ bx, by, i }) => {
                  const mx = (cx + bx) / 2;
                  const path = `M ${cx} ${cy} C ${mx} ${cy}, ${mx} ${by}, ${bx} ${by}`;
                  return (
                    <motion.path
                      key={`c-${i}`}
                      d={path}
                      fill="none"
                      stroke={`url(#mm-grad-${i % COLORS.length})`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.7 }}
                      transition={{ duration: 0.6, delay: 0.1 + i * 0.08 }}
                    />
                  );
                })}

                {/* Nodo central */}
                <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
                  <circle cx={cx} cy={cy} r="78" fill="url(#mm-center)" filter="url(#mm-glow)" />
                  <circle cx={cx} cy={cy} r="78" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white"
                    style={{ fontSize: data.central.length > 18 ? 15 : 19, fontWeight: 800 }}
                  >
                    {wrap(data.central, 16).map((line, li, arr) => (
                      <tspan key={li} x={cx} dy={li === 0 ? -(arr.length - 1) * 10 : 20}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </motion.g>

                {/* Ramas */}
                {layout.map(({ branch, bx, by, i, onRight }) => {
                  const color = COLORS[i % COLORS.length];
                  const isOpen = expanded.has(i);
                  return (
                    <motion.g
                      key={`b-${i}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 14, delay: 0.3 + i * 0.08 }}
                      style={{ cursor: "pointer" }}
                      onClick={() => toggle(i)}
                    >
                      {/* Nodo rama */}
                      <rect
                        x={bx - 92}
                        y={by - 24}
                        width="184"
                        height="48"
                        rx="24"
                        fill={`url(#mm-grad-${i % COLORS.length})`}
                      />
                      <text
                        x={bx}
                        y={by}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white"
                        style={{ fontSize: 14, fontWeight: 700 }}
                      >
                        {branch.emoji ? `${branch.emoji} ` : ""}
                        {truncate(branch.label, 18)}
                      </text>

                      {/* Items (cuando está abierta) */}
                      <AnimatePresence>
                        {isOpen &&
                          branch.items?.slice(0, 5).map((it, j) => {
                            const iy = by + 42 + j * 30;
                            const ix = onRight ? bx + 20 : bx - 20;
                            const anchor = onRight ? "start" : "end";
                            return (
                              <motion.g
                                key={j}
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: j * 0.04 }}
                              >
                                <circle cx={onRight ? bx - 70 : bx + 70} cy={by + 18} r="2" fill={color.from} />
                                <text
                                  x={ix}
                                  y={iy}
                                  textAnchor={anchor}
                                  className="fill-[#e6e6f0]"
                                  style={{ fontSize: 12.5 }}
                                >
                                  • {truncate(it.text, onRight ? 34 : 34)}
                                </text>
                              </motion.g>
                            );
                          })}
                      </AnimatePresence>
                    </motion.g>
                  );
                })}
              </svg>
            </div>

            <p className="mt-2 text-center text-xs text-muted">{t.mindmap.tapBranch}</p>

            {/* Detalle del tema + items con detalle (lista legible debajo) */}
            {data.summary && (
              <p className="glass mt-4 rounded-2xl p-4 text-sm text-foreground/80">{data.summary}</p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.branches.map((b, i) => (
                <div key={i} className="glass rounded-2xl p-4">
                  <p
                    className="mb-2 inline-block rounded-lg px-2 py-0.5 text-sm font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${COLORS[i % COLORS.length].from}, ${COLORS[i % COLORS.length].to})` }}
                  >
                    {b.emoji} {b.label}
                  </p>
                  <ul className="space-y-1.5">
                    {b.items?.map((it, j) => (
                      <li key={j} className="text-sm text-foreground/85">
                        <span className="font-medium">• {it.text}</span>
                        {it.detail && <span className="text-muted"> — {it.detail}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="glass flex items-center justify-center rounded-lg px-2.5 py-2 text-foreground/80 transition hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function wrap(text: string, max: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}
