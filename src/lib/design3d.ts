// ============================================================
// Motor de render de "objetos" de diseño con estilo 3D realista.
// No es un 3D con malla real: simula volumen con degradados, sombras,
// biselado (bevel), reflejos especulares y extrusión fake — el look que
// se consigue en Illustrator con "Efecto > 3D" o en estilos de capa.
// Es determinista (mismo objeto => mismo pixel) y rápido en canvas 2D.
// ============================================================

export type ShapeKind = "rect" | "circle" | "triangle" | "star" | "text" | "line";

export type DesignObject = {
  id: string;
  kind: ShapeKind;
  x: number;        // centro x (coords CSS del lienzo)
  y: number;        // centro y
  w: number;        // ancho
  h: number;        // alto
  rotation: number; // grados
  color: string;    // color base (hex)
  // Estilo 3D / material
  style: MaterialStyle;
  depth: number;    // "profundidad" de la extrusión 3D (px)
  // Solo texto
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  // Línea
  thickness?: number;
};

export type MaterialStyle = "flat" | "glossy" | "metal" | "glass" | "neon" | "soft";

export const MATERIALS: MaterialStyle[] = ["soft", "glossy", "metal", "glass", "neon", "flat"];

// --------- utilidades de color ---------
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(n, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}
function rgb(r: number, g: number, b: number, a = 1) {
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
}
function shade([r, g, b]: [number, number, number], f: number): [number, number, number] {
  // f < 0 oscurece, f > 0 aclara (hacia blanco).
  if (f < 0) return [r * (1 + f), g * (1 + f), b * (1 + f)];
  return [r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f];
}

/** Dibuja el contorno de la forma (sin estilo) en el path actual. */
function tracePath(ctx: CanvasRenderingContext2D, o: DesignObject) {
  const hw = o.w / 2;
  const hh = o.h / 2;
  ctx.beginPath();
  if (o.kind === "rect") {
    const r = Math.min(14, hw, hh);
    roundRect(ctx, -hw, -hh, o.w, o.h, r);
  } else if (o.kind === "circle") {
    ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
  } else if (o.kind === "triangle") {
    ctx.moveTo(0, -hh);
    ctx.lineTo(hw, hh);
    ctx.lineTo(-hw, hh);
    ctx.closePath();
  } else if (o.kind === "star") {
    star(ctx, 0, 0, 5, Math.min(hw, hh), Math.min(hw, hh) * 0.45);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outer: number, inner: number) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.moveTo(cx, cy - outer);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
    rot += step;
  }
  ctx.closePath();
}

/**
 * Renderiza UN objeto con su material 3D. Asume que el contexto NO está
 * transformado todavía (lo hacemos aquí según x/y/rotación).
 */
export function renderObject(ctx: CanvasRenderingContext2D, o: DesignObject) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate((o.rotation * Math.PI) / 180);

  if (o.kind === "line") {
    renderLine(ctx, o);
    ctx.restore();
    return;
  }
  if (o.kind === "text") {
    renderText(ctx, o);
    ctx.restore();
    return;
  }

  const base = hexToRgb(o.color);

  // 1) EXTRUSIÓN 3D: copias desplazadas hacia abajo-derecha, cada vez más oscuras.
  const depth = Math.max(0, o.depth);
  if (depth > 0 && o.style !== "glass" && o.style !== "neon") {
    const steps = Math.min(Math.round(depth), 40);
    for (let i = steps; i >= 1; i--) {
      const t = i / steps;
      ctx.save();
      ctx.translate(t * depth * 0.7, t * depth * 0.7);
      ctx.beginPath();
      tracePath(ctx, o);
      const side = shade(base, -0.55 * t - 0.1);
      ctx.fillStyle = rgb(side[0], side[1], side[2]);
      ctx.fill();
      ctx.restore();
    }
  }

  // 2) SOMBRA proyectada (contacto con el "suelo").
  ctx.save();
  ctx.shadowColor = "rgba(15,23,42,0.35)";
  ctx.shadowBlur = 18 + depth * 0.6;
  ctx.shadowOffsetX = 6 + depth * 0.5;
  ctx.shadowOffsetY = 10 + depth * 0.6;
  ctx.beginPath();
  tracePath(ctx, o);
  ctx.fillStyle = rgb(base[0], base[1], base[2]);
  ctx.fill();
  ctx.restore();

  // 3) CARA FRONTAL con material.
  ctx.save();
  tracePathAndClip(ctx, o);
  fillMaterial(ctx, o, base);
  ctx.restore();

  // 4) Borde sutil para definir el contorno.
  ctx.save();
  ctx.beginPath();
  tracePath(ctx, o);
  const edge = shade(base, -0.35);
  ctx.strokeStyle = rgb(edge[0], edge[1], edge[2], 0.6);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function tracePathAndClip(ctx: CanvasRenderingContext2D, o: DesignObject) {
  ctx.beginPath();
  tracePath(ctx, o);
  ctx.clip();
}

function boundsRadius(o: DesignObject) {
  return Math.max(o.w, o.h) / 2 || 1;
}

/** Rellena la cara frontal según el material elegido (el look 3D de verdad). */
function fillMaterial(ctx: CanvasRenderingContext2D, o: DesignObject, base: [number, number, number]) {
  const hw = o.w / 2;
  const hh = o.h / 2;
  const R = boundsRadius(o);

  if (o.style === "flat") {
    ctx.fillStyle = rgb(base[0], base[1], base[2]);
    ctx.fillRect(-hw - 2, -hh - 2, o.w + 4, o.h + 4);
    return;
  }

  if (o.style === "neon") {
    // Fondo oscuro + glow del color + núcleo claro.
    ctx.fillStyle = rgb(base[0] * 0.15, base[1] * 0.15, base[2] * 0.15);
    ctx.fillRect(-hw - 2, -hh - 2, o.w + 4, o.h + 4);
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, R);
    const bright = shade(base, 0.5);
    g.addColorStop(0, rgb(bright[0], bright[1], bright[2], 0.95));
    g.addColorStop(0.5, rgb(base[0], base[1], base[2], 0.85));
    g.addColorStop(1, rgb(base[0], base[1], base[2], 0.1));
    ctx.fillStyle = g;
    ctx.fillRect(-hw - 2, -hh - 2, o.w + 4, o.h + 4);
    return;
  }

  // Degradado de volumen: luz arriba-izquierda, sombra abajo-derecha.
  const lx = -hw * 0.55;
  const ly = -hh * 0.55;
  const grad = ctx.createLinearGradient(lx, ly, hw * 0.7, hh * 0.7);

  if (o.style === "metal") {
    const hi = shade(base, 0.75);
    const mid = shade(base, 0.1);
    const lo = shade(base, -0.5);
    grad.addColorStop(0, rgb(hi[0], hi[1], hi[2]));
    grad.addColorStop(0.35, rgb(mid[0], mid[1], mid[2]));
    grad.addColorStop(0.55, rgb(base[0], base[1], base[2]));
    grad.addColorStop(0.75, rgb(mid[0], mid[1], mid[2]));
    grad.addColorStop(1, rgb(lo[0], lo[1], lo[2]));
  } else if (o.style === "glass") {
    const hi = shade(base, 0.7);
    grad.addColorStop(0, rgb(hi[0], hi[1], hi[2], 0.9));
    grad.addColorStop(0.5, rgb(base[0], base[1], base[2], 0.45));
    grad.addColorStop(1, rgb(base[0], base[1], base[2], 0.7));
  } else {
    // "glossy" y "soft": degradado clásico claro->base->oscuro.
    const hi = shade(base, o.style === "glossy" ? 0.65 : 0.35);
    const lo = shade(base, o.style === "glossy" ? -0.45 : -0.25);
    grad.addColorStop(0, rgb(hi[0], hi[1], hi[2]));
    grad.addColorStop(0.5, rgb(base[0], base[1], base[2]));
    grad.addColorStop(1, rgb(lo[0], lo[1], lo[2]));
  }

  ctx.fillStyle = grad;
  ctx.fillRect(-hw - 2, -hh - 2, o.w + 4, o.h + 4);

  // Reflejo especular (highlight) arriba-izquierda.
  if (o.style === "glossy" || o.style === "glass" || o.style === "metal") {
    const spec = ctx.createRadialGradient(-hw * 0.4, -hh * 0.5, 1, -hw * 0.4, -hh * 0.5, R * 0.9);
    spec.addColorStop(0, "rgba(255,255,255,0.7)");
    spec.addColorStop(0.3, "rgba(255,255,255,0.25)");
    spec.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spec;
    ctx.fillRect(-hw - 2, -hh - 2, o.w + 4, o.h + 4);
  }

  // Oscurecimiento en el borde inferior (ambient occlusion fake).
  const ao = ctx.createRadialGradient(0, hh * 0.2, R * 0.3, 0, hh * 0.3, R * 1.2);
  ao.addColorStop(0, "rgba(0,0,0,0)");
  ao.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = ao;
  ctx.fillRect(-hw - 2, -hh - 2, o.w + 4, o.h + 4);
}

function renderText(ctx: CanvasRenderingContext2D, o: DesignObject) {
  const base = hexToRgb(o.color);
  const size = o.fontSize || 44;
  const weight = o.fontWeight || 800;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const txt = o.text || "Texto";

  // Extrusión 3D del texto.
  const depth = Math.max(0, o.depth);
  const steps = Math.min(Math.round(depth), 30);
  for (let i = steps; i >= 1; i--) {
    const t = i / steps;
    const side = shade(base, -0.55 * t - 0.1);
    ctx.fillStyle = rgb(side[0], side[1], side[2]);
    ctx.fillText(txt, t * depth * 0.6, t * depth * 0.6);
  }

  // Cara frontal con degradado + sombra.
  ctx.save();
  ctx.shadowColor = "rgba(15,23,42,0.4)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 5;
  const hi = shade(base, 0.55);
  const lo = shade(base, -0.4);
  const grad = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
  grad.addColorStop(0, rgb(hi[0], hi[1], hi[2]));
  grad.addColorStop(0.5, rgb(base[0], base[1], base[2]));
  grad.addColorStop(1, rgb(lo[0], lo[1], lo[2]));
  ctx.fillStyle = grad;
  ctx.fillText(txt, 0, 0);
  ctx.restore();
}

function renderLine(ctx: CanvasRenderingContext2D, o: DesignObject) {
  const base = hexToRgb(o.color);
  const th = o.thickness || 6;
  ctx.save();
  ctx.shadowColor = "rgba(15,23,42,0.3)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.lineCap = "round";
  const grad = ctx.createLinearGradient(-o.w / 2, 0, o.w / 2, 0);
  const hi = shade(base, 0.4);
  grad.addColorStop(0, rgb(hi[0], hi[1], hi[2]));
  grad.addColorStop(1, rgb(base[0], base[1], base[2]));
  ctx.strokeStyle = grad;
  ctx.lineWidth = th;
  ctx.beginPath();
  ctx.moveTo(-o.w / 2, 0);
  ctx.lineTo(o.w / 2, 0);
  ctx.stroke();
  ctx.restore();
}

/** ¿El punto (px,py) en coords del lienzo cae dentro del objeto? (bounding box rotado) */
export function hitTest(o: DesignObject, px: number, py: number): boolean {
  const dx = px - o.x;
  const dy = py - o.y;
  const a = (-o.rotation * Math.PI) / 180;
  const rx = dx * Math.cos(a) - dy * Math.sin(a);
  const ry = dx * Math.sin(a) + dy * Math.cos(a);
  const hw = (o.kind === "line" ? o.w : o.w) / 2 + 6;
  const hh = (o.kind === "line" ? (o.thickness || 6) : o.h) / 2 + 6;
  return Math.abs(rx) <= hw && Math.abs(ry) <= hh;
}

/** Dibuja el marco de selección alrededor de un objeto. */
export function drawSelection(ctx: CanvasRenderingContext2D, o: DesignObject) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate((o.rotation * Math.PI) / 180);
  const hw = o.w / 2 + 6;
  const hh = (o.kind === "line" ? (o.thickness || 6) : o.h) / 2 + 6;
  ctx.strokeStyle = "#3b6fe5";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
  ctx.setLineDash([]);
  // Manija de rotación/escala (esquina inferior derecha).
  ctx.fillStyle = "#3b6fe5";
  ctx.beginPath();
  ctx.arc(hw, hh, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function newId() {
  return Math.random().toString(36).slice(2, 9);
}
