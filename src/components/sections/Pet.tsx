"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Egg, Sparkles, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { computeXP } from "@/lib/levels";
import { SectionHeader } from "../ui/SectionHeader";
import { cn } from "@/lib/utils";
import {
  type MascotId, MASCOTS, STAGES, HATCH_XP, stageIdx,
  eggSVG, creatureSVG, mascotPreviewSVG,
} from "@/lib/pet-svg";

const KEY = "sereno:pet";

type PetCfg = { mascot: MascotId; name: string; chosen: boolean };

function loadPet(): PetCfg {
  if (typeof window === "undefined") return { mascot: "azul", name: "", chosen: false };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && typeof raw === "object" && ["azul", "rojo", "verde"].includes(raw.mascot)) {
      return { mascot: raw.mascot, name: typeof raw.name === "string" ? raw.name : "", chosen: !!raw.chosen };
    }
  } catch { /* ignore */ }
  return { mascot: "azul", name: "", chosen: false };
}

export function Pet() {
  const { t, stats } = useApp();
  const xp = computeXP(stats);

  const [pet, setPet] = useState<PetCfg>({ mascot: "azul", name: "", chosen: false });
  const [nameInput, setNameInput] = useState("");
  const [wobble, setWobble] = useState(0);
  const [msg, setMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const floatRef = useRef<HTMLDivElement>(null);

  // Carga diferida (evita desajuste de hidratación servidor/cliente).
  useEffect(() => {
    const p = loadPet();
    setPet(p);
    setNameInput(p.name);
    setMounted(true);
  }, []);

  function persist(next: PetCfg) {
    setPet(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  const hatched = xp >= HATCH_XP;
  const si = stageIdx(xp);
  const stageName = STAGES[si]?.n ?? "Cría";

  // Fase: huevo (si no ha llegado a 100 XP) → elegir (eclosionó pero sin elección) → criatura.
  const phase: "egg" | "choose" | "creature" = !hatched ? "egg" : pet.chosen ? "creature" : "choose";

  function pet_() {
    setWobble((w) => w + 1);
    const phrases = [
      t.pet.sayHappy1, t.pet.sayHappy2, t.pet.sayHappy3,
    ];
    setMsg(phrases[Math.floor(Math.random() * phrases.length)]);
    // Corazón flotante.
    const el = document.createElement("span");
    el.textContent = phase === "egg" ? "✨" : "💛";
    el.className = "pointer-events-none absolute text-2xl";
    el.style.left = `${35 + Math.random() * 30}%`;
    el.style.bottom = "45%";
    el.style.animation = "reveal-up 0.9s ease forwards";
    floatRef.current?.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function choose(id: MascotId) {
    persist({ ...pet, mascot: id });
  }
  function confirmChoice() {
    const name = (nameInput || "").trim() || MASCOTS.find((m) => m.id === pet.mascot)?.name || "Huevi";
    persist({ mascot: pet.mascot, name, chosen: true });
    setMsg(t.pet.welcome.replace("{name}", name));
  }
  function resetChoice() {
    persist({ ...pet, chosen: false, name: "" });
    setNameInput("");
  }

  // Progreso de la barra según la fase.
  let pct = 0, sub = "", hint = "";
  if (phase === "egg") {
    pct = xp / HATCH_XP;
    sub = t.pet.eggSub.replace("{xp}", String(HATCH_XP));
    hint = xp < 30 ? t.pet.eggHint1 : xp < 60 ? t.pet.eggHint2 : t.pet.eggHint3;
  } else if (phase === "choose") {
    pct = 1;
    sub = t.pet.chooseSub;
  } else {
    const nx = STAGES[si + 1];
    pct = nx ? (xp - STAGES[si].min) / (nx.min - STAGES[si].min) : 1;
    sub = `${stageName} · ${t.pet.levelWord} ${Math.floor(xp / 50) + 1}`;
    hint = nx ? t.pet.toNext.replace("{xp}", String(nx.min - xp)).replace("{stage}", nx.n) : t.pet.maxStage;
  }

  const svg =
    phase === "egg" ? eggSVG(xp)
      : phase === "choose" ? creatureSVG(pet.mascot, pet.name, HATCH_XP)
        : creatureSVG(pet.mascot, pet.name, xp);

  return (
    <div className="mx-auto max-w-lg px-4 pb-nav">
      <SectionHeader icon={Egg} title={t.pet.title} subtitle={t.pet.subtitle} />

      <div className="mt-5 space-y-4">
        {/* HUD: XP + barra */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-lg font-bold">{phase === "egg" ? t.pet.yourEgg : pet.name || t.pet.yourCreature}</p>
              <p className="text-sm text-muted">{sub}</p>
            </div>
            <p className="text-xl font-extrabold text-warn">{mounted ? xp : 0} XP</p>
          </div>
          <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-brand to-accent"
              initial={false} animate={{ width: `${Math.round(Math.min(1, Math.max(0, pct)) * 100)}%` }}
              transition={{ duration: 0.5 }} />
          </div>
          {hint && <p className="mt-2 min-h-[20px] text-sm text-muted">{hint}</p>}
        </div>

        {/* Escenario */}
        <div ref={floatRef} className="glass relative flex h-[320px] items-end justify-center overflow-hidden rounded-3xl">
          <motion.div
            key={wobble}
            onClick={pet_}
            initial={false}
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.45 }}
            className="h-[280px] w-auto cursor-pointer select-none [&_svg]:h-[280px] [&_svg]:w-auto [&_svg]:overflow-visible"
            dangerouslySetInnerHTML={{ __html: svg }}
            role="button"
            aria-label={phase === "egg" ? t.pet.yourEgg : pet.name || t.pet.yourCreature}
          />
          {phase === "choose" && (
            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-brand/90 px-3 py-1 text-xs font-semibold text-white">
              {t.pet.hatched} 🎉
            </div>
          )}
        </div>

        {msg && <p className="text-center text-sm font-medium text-accent">{msg}</p>}

        {/* Fase: elegir mascota */}
        {phase === "choose" && (
          <div className="glass space-y-3 rounded-2xl p-4">
            <h2 className="text-lg font-bold">{t.pet.chooseTitle}</h2>
            <p className="text-sm text-muted">{t.pet.chooseDesc}</p>
            <div className="grid grid-cols-3 gap-2">
              {MASCOTS.map((m) => (
                <button key={m.id} onClick={() => choose(m.id)}
                  className={cn("rounded-2xl border-2 p-2 text-center transition",
                    pet.mascot === m.id ? "border-brand bg-brand/10" : "border-white/10 hover:border-white/25")}>
                  <span className="mx-auto block h-20 w-full [&_svg]:h-20 [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: mascotPreviewSVG(m.id) }} />
                  <b className="block text-sm">{m.name}</b>
                  <small className="block text-xs text-muted">{m.tagline}</small>
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">{t.pet.nameLabel}</label>
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} maxLength={16}
                placeholder={t.pet.namePlaceholder}
                className="glass w-full rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50" />
            </div>
            <button onClick={confirmChoice}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-4 py-3 font-semibold text-white transition hover:opacity-90">
              <Sparkles className="h-5 w-5" /> {t.pet.present}
            </button>
          </div>
        )}

        {/* Fase: criatura — explicación + reset */}
        {phase === "creature" && (
          <>
            <div className="glass rounded-2xl p-4 text-sm text-foreground/85">
              <p className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {t.pet.growInfo}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {STAGES.map((s, i) => (
                <div key={s.n} className={cn("rounded-xl p-2 text-center text-xs ring-1 transition",
                  i <= si ? "bg-brand/15 text-foreground ring-brand/30" : "bg-white/5 text-muted ring-white/10")}>
                  <p className="font-semibold">{s.n}</p>
                  <p className="text-[10px]">{s.min} XP</p>
                </div>
              ))}
            </div>
            <button onClick={resetChoice}
              className="mx-auto flex items-center gap-1.5 text-xs text-muted underline transition hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> {t.pet.rechoose}
            </button>
          </>
        )}

        {phase === "egg" && (
          <div className="glass rounded-2xl p-4 text-center text-sm text-muted">
            {t.pet.eggInfo}
          </div>
        )}
      </div>
    </div>
  );
}
