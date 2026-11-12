// ============================================================
// Mascota de estudio de Sereno — SVGs portados del mini-proyecto
// "Mascotas Expoandes". Son funciones puras que devuelven SVG como
// string; la criatura evoluciona de forma según el XP real del alumno.
// ============================================================

export type MascotId = "azul" | "rojo" | "verde";
export type Form = 0 | 1 | 2;

export type MascotInfo = { id: MascotId; name: string; tagline: string };
export type Stage = { n: string; min: number };

// Etapas por XP (se alimentan del XP real del estudiante).
export const STAGES: Stage[] = [
  { n: "Cría", min: 100 },
  { n: "Joven", min: 300 },
  { n: "Adulto", min: 700 },
  { n: "Legendario", min: 1500 },
];
export const STAGE_FORM: Form[] = [0, 1, 2, 2];
export const HATCH_XP = 100;

export const MASCOTS: MascotInfo[] = [
  { id: "azul", name: "Bluno", tagline: "Tranquilo y fuerte" },
  { id: "rojo", name: "Flamo", tagline: "Valiente y ardiente" },
  { id: "verde", name: "Floro", tagline: "Curioso y alegre" },
];

export const stageIdx = (xp: number): number => {
  let k = -1;
  STAGES.forEach((s, i) => { if (xp >= s.min) k = i; });
  return Math.max(0, k);
};

// ---------- Huevo ----------
export function eggSVG(xp: number): string {
  const p = Math.min(1, xp / HATCH_XP);
  const sc = (0.55 + 0.45 * p).toFixed(3);
  const cracks = [
    xp >= 30 ? '<path d="M92 60 L104 80 L94 96 L108 116" />' : "",
    xp >= 60 ? '<path d="M150 120 L132 132 L142 150 L124 166" />' : "",
    xp >= 90 ? '<path d="M44 140 L66 150 L56 172 L80 184 M108 116 L90 140" />' : "",
  ].join("");
  return `<svg viewBox="0 0 200 240" role="img" aria-label="Huevo al ${Math.round(p * 100)} por ciento">
  <defs><linearGradient id="sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6f1ff"/><stop offset="1" stop-color="#cdbdf0"/></linearGradient></defs>
  <g transform="translate(100 226) scale(${sc}) translate(-100 -226)">
    <path d="M100 20C150 20 180 120 180 160C180 205 144 225 100 225C56 225 20 205 20 160C20 120 50 20 100 20Z" fill="url(#sh)" stroke="#8d78c4" stroke-width="3"/>
    <g fill="#7bdcb5" opacity=".8"><circle cx="72" cy="150" r="9"/><circle cx="128" cy="105" r="7"/><circle cx="118" cy="180" r="11"/><circle cx="64" cy="108" r="5"/></g>
    <g fill="none" stroke="#4b3a7a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${cracks}</g>
  </g></svg>`;
}

// ---------- Mascotas ----------
type Pal = { main: string; dark: string; edge: string; belly: string; spot: string; horn: string; hornEdge: string; iris: string; claw: string };

const PAL: Record<MascotId, Pal> = {
  azul: { main: "#4da6f2", dark: "#2f72d6", edge: "#1f4aa0", belly: "#f1f5fb", spot: "#2f72d6", horn: "#f4bb44", hornEdge: "#c98a17", iris: "#2a5cc0", claw: "#f3e8cf" },
  rojo: { main: "#e8392f", dark: "#b8261f", edge: "#7d1714", belly: "#ff9a45", spot: "#ff8447", horn: "#efdcae", hornEdge: "#bfa56a", iris: "#3aa83a", claw: "#f6e3b0" },
  verde: { main: "#79c240", dark: "#4f9c2b", edge: "#35731c", belly: "#dcf08c", spot: "#4f9c2b", horn: "#a8dd4e", hornEdge: "#4f9c2b", iris: "#2b6cc4", claw: "#f1ecc4" },
};

const INK = "#1b2038";
const n = (v: number): number => Math.round(v * 10) / 10;

const ell = (cx: number, cy: number, rx: number, ry: number, fill: string, stroke = "none", rot = 0, sw = 2.5): string =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}"${stroke !== "none" ? ` stroke="${stroke}" stroke-width="${sw}"` : ""}${rot ? ` transform="rotate(${rot} ${n(cx)} ${n(cy)})"` : ""}/>`;

const eye = (x: number, y: number, r: number, iris: string): string =>
  `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#fff" stroke="${INK}" stroke-width="1.6"/>` +
  `<circle cx="${n(x)}" cy="${n(y + r * 0.1)}" r="${n(r * 0.66)}" fill="${iris}"/>` +
  `<circle cx="${n(x)}" cy="${n(y + r * 0.1)}" r="${n(r * 0.36)}" fill="#0e1430"/>` +
  `<circle cx="${n(x + r * 0.26)}" cy="${n(y - r * 0.2)}" r="${n(r * 0.2)}" fill="#fff"/>`;

const mouth = (x: number, y: number, w: number, h: number): string =>
  `<path d="M${n(x - w)} ${n(y)}Q${n(x)} ${n(y + h * 2.2)} ${n(x + w)} ${n(y)}Q${n(x)} ${n(y - h * 0.4)} ${n(x - w)} ${n(y)}Z" fill="#7d1633" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>` +
  `<ellipse cx="${n(x)}" cy="${n(y + h * 0.75)}" rx="${n(w * 0.42)}" ry="${n(h * 0.3)}" fill="#ff7fa6"/>` +
  `<path d="M${n(x - w * 0.72)} ${n(y - h * 0.1)}L${n(x - w * 0.5)} ${n(y - h * 0.1)}L${n(x - w * 0.61)} ${n(y + h * 0.7)}ZM${n(x + w * 0.72)} ${n(y - h * 0.1)}L${n(x + w * 0.5)} ${n(y - h * 0.1)}L${n(x + w * 0.61)} ${n(y + h * 0.7)}Z" fill="#fff"/>`;

const spots = (p: Pal, list: [number, number, number][], op = 0.55): string =>
  `<g fill="${p.spot}" opacity="${op}">${list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`;

const horn = (p: Pal, side: -1 | 1, x: number, y: number, w: number, h: number, lean: number): string => {
  const l = x - w / 2, r = x + w / 2;
  const tx = x - lean, ty = y - h;
  const d = `M${n(l)} ${n(y)}Q${n(l - lean * 0.55)} ${n(y - h * 0.3)} ${n(tx)} ${n(ty)}Q${n(r - lean * 0.2)} ${n(y - h * 0.55)} ${n(r)} ${n(y)}Z`;
  return `<path d="${d}" fill="${p.horn}" stroke="${p.hornEdge}" stroke-width="2.2" stroke-linejoin="round"${side === 1 ? ` transform="translate(${n(2 * x)} 0) scale(-1 1)"` : ""}/>`;
};

const flame = (x: number, y: number, s: number): string =>
  `<g transform="translate(${n(x)} ${n(y)}) scale(${s})"><path d="M-12 2C-17-14-4-20-3-38C4-27 15-20 12 2Z" fill="#ff8a1f" stroke="#d94a12" stroke-width="2" stroke-linejoin="round"/><path d="M-6 2C-9-8-2-13-1-24C3-16 9-10 6 2Z" fill="#ffd23f"/></g>`;

const claws = (p: Pal, xs: number[], y: number, s = 1): string =>
  xs.map((x) => `<path d="M${n(x - 3.5 * s)} ${n(y)}L${n(x + 3.5 * s)} ${n(y)}L${n(x)} ${n(y + 8 * s)}Z" fill="${p.claw}" stroke="${p.edge}" stroke-width="1.2" stroke-linejoin="round"/>`).join("");

const feet = (p: Pal, dx: number, rx: number, ry: number): string =>
  ell(100 - dx, 198, rx, ry, p.dark, p.edge, 0, 2.2) + ell(100 + dx, 198, rx, ry, p.dark, p.edge, 0, 2.2);

const burst = (color: string, side: -1 | 1, y: number): string => {
  const x = side === -1 ? 14 : 186;
  return `<g stroke="${color}" stroke-width="4.5" stroke-linecap="round" fill="none" opacity=".85"><path d="M${x} ${y}l${-side * -12} ${-4}"/><path d="M${x - side * 2} ${y + 14}l${-side * -14} ${2}"/><path d="M${x + side * 2} ${y - 14}l${-side * -10} ${-9}"/></g>`;
};

type Piece = { back: string; front: string };

function azul(form: Form): Piece {
  const p = PAL.azul;
  const body = (cx: number, cy: number, rx: number, ry: number) => ell(cx, cy, rx, ry, p.main, p.edge);
  if (form === 0) {
    return {
      back: ell(50, 152, 11, 7, p.main, p.edge, -35, 2.2) + ell(150, 152, 11, 7, p.main, p.edge, 35, 2.2) + feet(p, 20, 14, 7) + horn(p, -1, 72, 104, 16, 30, 12) + horn(p, 1, 128, 104, 16, 30, 12),
      front: body(100, 148, 50, 52) + ell(100, 176, 27, 20, p.belly) + spots(p, [[72, 132, 4], [130, 138, 3.5], [78, 150, 2.5]]) + eye(100, 124, 18, p.iris) + mouth(100, 152, 16, 6),
    };
  }
  if (form === 1) {
    const tuft = `<path d="M82 96L85 76L92 90L100 68L108 90L115 76L118 96Z" fill="${p.main}" stroke="${p.edge}" stroke-width="2.2" stroke-linejoin="round"/>`;
    return {
      back: ell(46, 152, 13, 27, p.main, p.edge, 14, 2.4) + ell(154, 152, 13, 27, p.main, p.edge, -14, 2.4) + feet(p, 22, 17, 8) + tuft + horn(p, -1, 68, 100, 18, 34, 16) + horn(p, 1, 132, 100, 18, 34, 16),
      front: body(100, 142, 54, 58) + ell(100, 175, 31, 23, p.belly) + spots(p, [[68, 124, 5], [136, 128, 4.5], [74, 154, 3.5], [132, 156, 3]]) + eye(82, 118, 14, p.iris) + eye(118, 118, 14, p.iris) + mouth(100, 150, 22, 8),
    };
  }
  return {
    back: burst(p.dark, -1, 62) + burst(p.dark, 1, 62) + ell(34, 150, 18, 37, p.main, p.edge, 18, 2.6) + ell(166, 150, 18, 37, p.main, p.edge, -18, 2.6) + claws(p, [20, 30, 40], 182) + claws(p, [160, 170, 180], 182) + feet(p, 30, 19, 8) + claws(p, [62, 72, 82], 200, 0.8) + claws(p, [118, 128, 138], 200, 0.8) + `<path d="M78 82L82 62L90 78L100 54L110 78L118 62L122 82Z" fill="${p.main}" stroke="${p.edge}" stroke-width="2.2" stroke-linejoin="round"/>` + horn(p, -1, 64, 92, 24, 48, 24) + horn(p, 1, 136, 92, 24, 48, 24),
    front: body(100, 140, 64, 64) + ell(100, 176, 38, 26, p.belly) + spots(p, [[62, 124, 6], [140, 130, 5], [70, 160, 4], [134, 162, 4.5], [100, 112, 3]]) + eye(76, 118, 14, p.iris) + eye(124, 118, 14, p.iris) + eye(100, 94, 11, p.iris) + mouth(100, 148, 30, 11),
  };
}

function rojo(form: Form): Piece {
  const p = PAL.rojo;
  const body = (cx: number, cy: number, rx: number, ry: number) => ell(cx, cy, rx, ry, p.main, p.edge);
  if (form === 0) {
    const tuft = `<path d="M90 102Q86 84 100 70Q98 86 110 90Q112 98 108 102Z" fill="${p.main}" stroke="${p.edge}" stroke-width="2.2" stroke-linejoin="round"/>`;
    return {
      back: ell(50, 152, 11, 8, p.main, p.edge, -35, 2.2) + ell(150, 152, 11, 8, p.main, p.edge, 35, 2.2) + feet(p, 20, 14, 7) + tuft + horn(p, -1, 70, 106, 16, 32, 12) + horn(p, 1, 130, 106, 16, 32, 12),
      front: body(100, 148, 50, 52) + spots(p, [[70, 168, 4], [88, 178, 3], [118, 176, 4], [132, 160, 3.5], [66, 140, 3]], 0.75) + eye(82, 124, 14, p.iris) + eye(118, 124, 14, p.iris) + mouth(100, 152, 15, 6),
    };
  }
  if (form === 1) {
    return {
      back: ell(46, 152, 13, 26, p.main, p.edge, 14, 2.4) + ell(154, 152, 13, 26, p.main, p.edge, -14, 2.4) + feet(p, 22, 17, 8) + flame(100, 92, 1) + horn(p, -1, 68, 102, 18, 38, 16) + horn(p, 1, 132, 102, 18, 38, 16),
      front: body(100, 142, 54, 58) + spots(p, [[68, 168, 5], [90, 184, 4], [120, 182, 5], [138, 164, 4], [64, 138, 4], [140, 134, 3.5]], 0.75) + eye(80, 118, 14, p.iris) + eye(120, 118, 14, p.iris) + mouth(100, 150, 22, 8),
    };
  }
  return {
    back: flame(28, 130, 0.95) + flame(172, 130, 0.95) + ell(34, 150, 18, 37, p.main, p.edge, 18, 2.6) + ell(166, 150, 18, 37, p.main, p.edge, -18, 2.6) + claws(p, [20, 30, 40], 182) + claws(p, [160, 170, 180], 182) + feet(p, 30, 19, 8) + claws(p, [62, 72, 82], 200, 0.8) + claws(p, [118, 128, 138], 200, 0.8) + flame(100, 84, 1.45) + flame(80, 82, 0.85) + flame(120, 82, 0.85) + horn(p, -1, 64, 94, 24, 52, 22) + horn(p, 1, 136, 94, 24, 52, 22),
    front: body(100, 140, 64, 64) + `<path d="M74 190Q70 160 100 150Q130 160 126 190Q100 198 74 190Z" fill="${p.belly}"/>` + `<path d="M100 172Q94 182 100 190Q106 182 100 172Z" fill="#ffd23f"/>` + spots(p, [[62, 122, 6], [142, 126, 5], [64, 162, 4], [138, 160, 4]], 0.75) + eye(76, 118, 14, p.iris) + eye(124, 118, 14, p.iris) + eye(100, 94, 11, p.iris) + mouth(100, 148, 30, 11),
  };
}

function verde(form: Form): Piece {
  const p = PAL.verde;
  const body = (cx: number, cy: number, rx: number, ry: number) => ell(cx, cy, rx, ry, p.main, p.edge);
  const antenna = (x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, r: number) =>
    `<path d="M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}" stroke="${p.edge}" stroke-width="8" fill="none" stroke-linecap="round"/>` +
    `<path d="M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}" stroke="${p.main}" stroke-width="4.5" fill="none" stroke-linecap="round"/>` +
    `<circle cx="${x2}" cy="${y2}" r="${r}" fill="${p.horn}" stroke="${p.edge}" stroke-width="2"/>`;
  const leaf = (x: number, y: number, w: number, h: number, rot = 0) =>
    `<path d="M${x} ${y}Q${x - w} ${y - h * 0.5} ${x} ${y - h}Q${x + w} ${y - h * 0.5} ${x} ${y}Z" fill="#6cc03a" stroke="${p.edge}" stroke-width="2" stroke-linejoin="round"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ""}/>`;
  if (form === 0) {
    return {
      back: antenna(82, 106, 68, 98, 70, 78, 7) + antenna(118, 106, 132, 98, 130, 78, 7) + ell(52, 154, 10, 18, p.main, p.edge, 25, 2.2) + ell(148, 154, 10, 18, p.main, p.edge, -25, 2.2) + feet(p, 20, 14, 7),
      front: body(100, 148, 48, 52) + ell(100, 176, 25, 19, p.belly) + spots(p, [[74, 134, 4], [128, 140, 3.5], [66, 156, 3]], 0.45) + eye(84, 126, 13, p.iris) + eye(116, 126, 13, p.iris) + mouth(100, 152, 14, 6),
    };
  }
  if (form === 1) {
    const fin = (s: -1 | 1) =>
      `<path d="M${100 + s * 50} 118Q${100 + s * 76} 100 ${100 + s * 68} 134Q${100 + s * 58} 138 ${100 + s * 50} 132Z" fill="${p.dark}" stroke="${p.edge}" stroke-width="2" stroke-linejoin="round"/>`;
    return {
      back: antenna(78, 98, 56, 92, 60, 66, 8) + antenna(122, 98, 144, 92, 140, 66, 8) + fin(-1) + fin(1) + ell(48, 154, 11, 22, p.main, p.edge, 22, 2.3) + ell(152, 154, 11, 22, p.main, p.edge, -22, 2.3) + feet(p, 22, 17, 8) + `<g>${leaf(100, 90, 12, 30, -22)}${leaf(100, 90, 12, 30, 22)}${leaf(100, 90, 12, 34)}</g>`,
      front: body(100, 142, 54, 58) + ell(100, 175, 31, 23, p.belly) + spots(p, [[68, 126, 5], [136, 130, 4.5], [70, 158, 3.5], [134, 160, 3]], 0.45) + eye(82, 118, 14, p.iris) + eye(118, 118, 14, p.iris) + mouth(100, 150, 22, 8),
    };
  }
  return {
    back: burst(p.dark, -1, 62) + burst(p.dark, 1, 62) + antenna(76, 90, 48, 84, 52, 52, 9) + antenna(124, 90, 152, 84, 148, 52, 9) +
      `<path d="M52 144Q22 130 24 94" stroke="${p.edge}" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M52 144Q22 130 24 94" stroke="${p.main}" stroke-width="25" fill="none" stroke-linecap="round"/>` +
      `<path d="M148 144Q178 130 176 94" stroke="${p.edge}" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M148 144Q178 130 176 94" stroke="${p.main}" stroke-width="25" fill="none" stroke-linecap="round"/>` +
      `<g fill="${p.main}" stroke="${p.edge}" stroke-width="2"><circle cx="14" cy="84" r="6"/><circle cx="24" cy="78" r="6"/><circle cx="34" cy="82" r="6"/><circle cx="186" cy="84" r="6"/><circle cx="176" cy="78" r="6"/><circle cx="166" cy="82" r="6"/></g>` +
      feet(p, 30, 19, 8) + claws(p, [62, 72, 82], 200, 0.8) + claws(p, [118, 128, 138], 200, 0.8) + `<g>${leaf(100, 84, 14, 44, -30)}${leaf(100, 84, 14, 44, 30)}${leaf(100, 84, 16, 52)}</g>`,
    front: body(100, 140, 62, 64) + ell(100, 176, 36, 26, p.belly) + spots(p, [[62, 124, 6], [140, 130, 5], [66, 160, 4], [136, 162, 4.5], [100, 110, 3]], 0.45) + eye(76, 118, 14, p.iris) + eye(124, 118, 14, p.iris) + eye(100, 94, 11, p.iris) + mouth(100, 148, 30, 11),
  };
}

const BUILD: Record<MascotId, (f: Form) => Piece> = { azul, rojo, verde };

const starSvg = (x: number, y: number, s: number): string =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0-9L2.5-2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5-2.5Z" fill="#ffd34d" stroke="#e0a22d" stroke-width="1"/>`;

/** Criatura completa que crece con el XP. */
export function creatureSVG(mascot: MascotId, name: string, xp: number): string {
  const si = stageIdx(xp);
  const form = STAGE_FORM[si];
  const sc = ((0.8 + 0.25 * Math.min(1, Math.max(0, xp - 100) / 1400)) * (form === 0 ? 0.92 : 1)).toFixed(3);
  const { back, front } = BUILD[mascot](form);
  let aura = "", sparks = "";
  if (si >= 3) {
    aura = `<defs><radialGradient id="au"><stop offset="0" stop-color="#ffe9a6" stop-opacity=".95"/><stop offset="1" stop-color="#ffe9a6" stop-opacity="0"/></radialGradient></defs><circle class="pet-aura" cx="100" cy="135" r="120" fill="url(#au)"/>`;
    sparks = starSvg(22, 44, 1.3) + starSvg(178, 36, 1.3) + starSvg(186, 120, 1);
  }
  const shadow = `<ellipse cx="100" cy="204" rx="${40 + form * 12}" ry="6" fill="#000" opacity=".12"/>`;
  return `<svg viewBox="0 0 200 220" role="img" aria-label="${(name || "Tu criatura").replace(/"/g, "&quot;")}, ${STAGES[si].n}"><g transform="translate(100 203) scale(${sc}) translate(-100 -203)">${aura}${shadow}${back}${front}${sparks}</g></svg>`;
}

/** Vista previa pequeña (forma 0) para las tarjetas de selección. */
export function mascotPreviewSVG(id: MascotId): string {
  const { back, front } = BUILD[id](0);
  return `<svg viewBox="20 56 160 156" role="img"><ellipse cx="100" cy="204" rx="40" ry="6" fill="#000" opacity=".12"/>${back}${front}</svg>`;
}
