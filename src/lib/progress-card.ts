"use client";

// Genera una "tarjeta de progreso" (imagen PNG) con el avance del estudiante,
// dibujada con Canvas (sin dependencias). Diseño original de Sereno.

export type ProgressCardData = {
  name: string;
  level: number;
  xp: number;
  streak: number;
  overall: number | null; // dominio global 0..100
  topSubject?: { subject: string; score: number } | null;
  labels: {
    title: string;      // "Mi avance en Sereno"
    level: string;      // "Nivel"
    xp: string;         // "XP"
    streak: string;     // "días"
    mastery: string;    // "Dominio"
    tagline: string;    // "Estudia sin estrés · ExpoUniandes"
  };
};

/** Dibuja la tarjeta y devuelve un dataURL PNG (1200×630, formato social). */
export function renderProgressCard(d: ProgressCardData): string {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Fondo degradado azul-pizarra → azul marca.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#060910");
  bg.addColorStop(0.6, "#0b1222");
  bg.addColorStop(1, "#13213f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Resplandor de marca (dos orbes suaves).
  drawGlow(ctx, 160, 120, 320, "rgba(59,111,229,0.35)");
  drawGlow(ctx, W - 140, H - 100, 360, "rgba(56,189,248,0.22)");

  // Rejilla sutil.
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 48) line(ctx, x, 0, x, H);
  for (let y = 0; y <= H; y += 48) line(ctx, 0, y, W, y);

  // Marca Sereno.
  ctx.fillStyle = "#38bdf8";
  ctx.font = "700 30px system-ui, -apple-system, sans-serif";
  ctx.fillText("Sereno", 64, 86);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "400 20px system-ui, sans-serif";
  ctx.fillText(d.labels.tagline, 64, 118);

  // Título.
  ctx.fillStyle = "#eef1f6";
  ctx.font = "800 56px system-ui, sans-serif";
  ctx.fillText(d.labels.title, 64, 220);

  // Nombre.
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "600 34px system-ui, sans-serif";
  ctx.fillText(truncate(ctx, d.name, 600), 64, 276);

  // Tarjetas de métricas.
  const stats: { value: string; label: string }[] = [
    { value: String(d.level), label: d.labels.level },
    { value: String(d.xp), label: d.labels.xp },
    { value: `${d.streak}`, label: d.labels.streak },
  ];
  if (d.overall !== null) stats.push({ value: `${d.overall}%`, label: d.labels.mastery });

  const cardW = 250;
  const gap = 24;
  const startX = 64;
  const cardY = 340;
  stats.slice(0, 4).forEach((s, i) => {
    const x = startX + i * (cardW + gap);
    roundRect(ctx, x, cardY, cardW, 180, 24);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.stroke();

    // Valor con degradado.
    const grad = ctx.createLinearGradient(x, cardY, x + cardW, cardY + 180);
    grad.addColorStop(0, "#5b8def");
    grad.addColorStop(1, "#38bdf8");
    ctx.fillStyle = grad;
    ctx.font = "800 64px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(s.value, x + cardW / 2, cardY + 92);

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "500 22px system-ui, sans-serif";
    ctx.fillText(s.label, x + cardW / 2, cardY + 140);
    ctx.textAlign = "left";
  });

  // Materia destacada.
  if (d.topSubject) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "500 24px system-ui, sans-serif";
    ctx.fillText(`${d.topSubject.subject} · ${d.topSubject.score}%`, 64, 580);
  }

  return canvas.toDataURL("image/png");
}

/** Descarga el dataURL como archivo PNG. */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ---- helpers de dibujo ----
function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}
