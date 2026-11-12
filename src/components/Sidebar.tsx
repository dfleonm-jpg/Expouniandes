"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  ListChecks,
  GraduationCap,
  PenLine,
  Search,
  Layers,
  FileText,
  Network,
  BookMarked,
  Code2,
  Sigma,
  CalendarClock,
  CalendarDays,
  Users,
  HeartPulse,
  HeartHandshake,
  Compass,
  BarChart3,
  Trophy,
  UserCircle,
  Flame,
  Palette,
  Egg,
  ChevronDown,
  Home,
  LayoutGrid,
  X,
} from "lucide-react";
import { LogOut } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";
import { UniandesMark } from "./ui/UniandesMark";
import { SerenoLogo } from "./ui/SerenoLogo";
import { cn } from "@/lib/utils";

export type Section =
  | "home"
  | "tutor"
  | "quiz"
  | "exam"
  | "openExam"
  | "search"
  | "flashcards"
  | "summary"
  | "mindmap"
  | "methods"
  | "codePractice"
  | "mathPractice"
  | "designStudio"
  | "planner"
  | "calendar"
  | "groups"
  | "wellbeing"
  | "support"
  | "diagnostic"
  | "progress"
  | "ranking"
  | "pet"
  | "profile";

type NavKey = keyof ReturnType<typeof useApp>["t"]["nav"];
type GroupKey = keyof ReturnType<typeof useApp>["t"]["navGroups"];

type Item = { id: Section; icon: typeof MessageSquare; key: NavKey };

// Navegación agrupada por categorías para mantener el orden.
const GROUPS: { group: GroupKey; items: Item[] }[] = [
  {
    group: "learn",
    items: [
      { id: "tutor", icon: MessageSquare, key: "tutor" },
      { id: "search", icon: Search, key: "search" },
      { id: "summary", icon: FileText, key: "summary" },
      { id: "mindmap", icon: Network, key: "mindmap" },
    ],
  },
  {
    group: "practice",
    items: [
      { id: "quiz", icon: ListChecks, key: "quiz" },
      { id: "exam", icon: GraduationCap, key: "exam" },
      { id: "openExam", icon: PenLine, key: "openExam" },
      { id: "flashcards", icon: Layers, key: "flashcards" },
    ],
  },
  {
    group: "science",
    items: [
      { id: "codePractice", icon: Code2, key: "codePractice" },
      { id: "mathPractice", icon: Sigma, key: "mathPractice" },
      { id: "designStudio", icon: Palette, key: "designStudio" },
    ],
  },
  {
    group: "organize",
    items: [
      { id: "methods", icon: BookMarked, key: "methods" },
      { id: "planner", icon: CalendarClock, key: "planner" },
      { id: "calendar", icon: CalendarDays, key: "calendar" },
      { id: "groups", icon: Users, key: "groups" },
    ],
  },
  {
    group: "wellness",
    items: [
      { id: "wellbeing", icon: HeartPulse, key: "wellbeing" },
      { id: "support", icon: HeartHandshake, key: "support" },
    ],
  },
  {
    group: "you",
    items: [
      { id: "profile", icon: UserCircle, key: "profile" },
      { id: "diagnostic", icon: Compass, key: "diagnostic" },
      { id: "progress", icon: BarChart3, key: "progress" },
      { id: "ranking", icon: Trophy, key: "ranking" },
      { id: "pet", icon: Egg, key: "pet" },
    ],
  },
];

// Icono representativo de cada grupo (encabezado del acordeón).
const GROUP_ICON: Record<GroupKey, typeof MessageSquare> = {
  home: Home,
  learn: MessageSquare,
  practice: ListChecks,
  science: Code2,
  organize: CalendarClock,
  wellness: HeartPulse,
  you: UserCircle,
};

// Grupo al que pertenece cada sección (para abrir el acordeón correcto).
const GROUP_OF: Partial<Record<Section, GroupKey>> = Object.fromEntries(
  GROUPS.flatMap((g) => g.items.map((it) => [it.id, g.group]))
) as Partial<Record<Section, GroupKey>>;

// Accesos directos SIEMPRE visibles en la barra inferior móvil (los demás
// viven en el panel "Más" para no saturar). El 5º es el botón "Más".
const MOBILE_QUICK: Item[] = [
  { id: "tutor", icon: MessageSquare, key: "tutor" },
  { id: "quiz", icon: ListChecks, key: "quiz" },
  { id: "planner", icon: CalendarClock, key: "planner" },
  { id: "pet", icon: Egg, key: "pet" },
];

export function Sidebar({
  active,
  onNavigate,
}: {
  active: Section;
  onNavigate: (s: Section) => void;
}) {
  const { t, streak } = useApp();
  const auth = useAuth();

  // Acordeón desktop: solo un grupo abierto a la vez. Arranca abierto el grupo
  // que contiene la sección activa (o "learn" por defecto).
  const [openGroup, setOpenGroup] = useState<GroupKey>(GROUP_OF[active] ?? "learn");
  // Panel "Más" del móvil (hoja inferior con todas las secciones).
  const [moreOpen, setMoreOpen] = useState(false);

  // Al navegar, abre el grupo de la sección activa y cierra el panel móvil.
  useEffect(() => {
    const g = GROUP_OF[active];
    if (g) setOpenGroup(g);
    setMoreOpen(false);
  }, [active]);

  function go(s: Section) {
    onNavigate(s);
    setMoreOpen(false);
  }

  return (
    <>
      {/* Sidebar desktop — acordeón colapsable */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col p-3 lg:flex">
        <div className="glass-strong flex h-full flex-col rounded-3xl p-4">
          {/* Logo */}
          <button
            onClick={() => onNavigate("home")}
            aria-label={t.brand}
            className="mb-4 flex shrink-0 items-center gap-3 px-2 transition hover:opacity-80"
          >
            <SerenoLogo className="h-10 w-10 shrink-0" />
            <div className="text-left">
              <p className="text-lg font-bold leading-none tracking-tight">{t.brand}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                <UniandesMark className="h-3.5 w-3.5" /> Uniandes
              </p>
            </div>
          </button>

          {/* Inicio (acceso directo fijo, fuera del acordeón) */}
          <button
            onClick={() => onNavigate("home")}
            className={cn(
              "mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              active === "home" ? "bg-white/[0.07] text-brand" : "text-muted hover:text-foreground hover:bg-white/5"
            )}
          >
            <Home className="h-[18px] w-[18px] shrink-0" />
            <span>{t.navGroups.home}</span>
          </button>

          {/* Nav en acordeón (con scroll propio) */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {GROUPS.map((g) => {
              const GroupIcon = GROUP_ICON[g.group];
              const isOpen = openGroup === g.group;
              const hasActive = g.items.some((it) => it.id === active);
              return (
                <div key={g.group}>
                  {/* Encabezado del grupo (toggle) */}
                  <button
                    onClick={() => setOpenGroup(isOpen ? ("" as GroupKey) : g.group)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                      hasActive && !isOpen ? "text-brand" : "text-foreground/80 hover:bg-white/5"
                    )}
                    aria-expanded={isOpen}
                  >
                    <GroupIcon className="h-[18px] w-[18px] shrink-0 text-muted" />
                    <span className="flex-1 text-left">{t.navGroups[g.group]}</span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", isOpen && "rotate-180")} />
                  </button>

                  {/* Ítems del grupo (colapsables) */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-0.5 space-y-0.5 pb-1 pl-3">
                          {g.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = active === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={cn(
                                  "relative flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition",
                                  isActive ? "bg-white/[0.07] text-brand" : "text-muted hover:text-foreground hover:bg-white/5"
                                )}
                              >
                                {isActive && (
                                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-brand" />
                                )}
                                <Icon className="h-[17px] w-[17px] shrink-0" />
                                <span>{t.nav[item.key]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Usuario + racha + idioma */}
          <div className="mt-3 shrink-0 space-y-3 border-t border-white/5 pt-3">
            {auth.enabled && auth.user && (
              <div className="glass flex items-center gap-2 rounded-xl px-2.5 py-2">
                {auth.user.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={auth.user.photo} alt="" className="h-7 w-7 rounded-full" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-xs font-bold text-white">
                    {auth.user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="flex-1 truncate text-sm font-medium">{auth.user.name}</span>
                <button
                  onClick={() => auth.logout()}
                  aria-label={t.ui.logout}
                  title={t.ui.logout}
                  className="text-muted transition hover:text-danger"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
            {streak > 0 && (
              <div className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-sm">
                <Flame className="h-4 w-4 text-warn" />
                <span className="font-semibold">{streak}</span>
                <span className="text-muted">{streak === 1 ? t.ui.day : t.ui.days} 🔥</span>
              </div>
            )}
            <LanguageSwitcher direction="up" />
          </div>
        </div>
      </aside>

      {/* Top bar móvil */}
      <header className="safe-top sticky top-0 z-40 lg:hidden">
        <div className="glass-strong mx-3 mt-3 flex items-center justify-between rounded-2xl px-3 py-2.5">
          <button onClick={() => onNavigate("home")} aria-label={t.brand} className="flex items-center gap-2.5">
            <SerenoLogo className="h-9 w-9" />
            <span className="text-lg font-bold tracking-tight">{t.brand}</span>
          </button>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <span className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
                <Flame className="h-3.5 w-3.5 text-warn" />
                {streak}
              </span>
            )}
            <div className="w-40">
              <LanguageSwitcher direction="down" />
            </div>
          </div>
        </div>
      </header>

      {/* Panel "Más" móvil (hoja inferior con todas las secciones agrupadas) */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="safe-bottom glass-strong fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-3xl p-4 lg:hidden"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">{t.ui.allSections}</span>
                <button onClick={() => setMoreOpen(false)} aria-label={t.ui.close} className="text-muted transition hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 pb-2">
                {GROUPS.map((g) => (
                  <div key={g.group}>
                    <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted/70">
                      {t.navGroups[g.group]}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {g.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = active === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => go(item.id)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                              isActive ? "bg-white/[0.08] text-brand" : "text-muted hover:text-foreground hover:bg-white/5"
                            )}
                          >
                            <Icon className="h-[18px] w-[18px] shrink-0" />
                            <span className="truncate">{t.nav[item.key]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Nav inferior móvil — accesos rápidos fijos + botón "Más" */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <nav
          className="glass-strong mx-3 mb-2 flex items-center justify-around gap-1 rounded-2xl px-2 py-1.5"
          aria-label={t.brand}
        >
          {MOBILE_QUICK.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition",
                  isActive ? "text-brand" : "text-muted active:scale-95"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 rounded-lg bg-white/[0.08]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="relative z-10 h-5 w-5" />
                <span className="relative z-10 max-w-[64px] truncate">{t.nav[item.key]}</span>
              </button>
            );
          })}
          {/* Botón "Más" */}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label={t.ui.more}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition",
              moreOpen ? "text-brand" : "text-muted active:scale-95"
            )}
          >
            <LayoutGrid className="relative z-10 h-5 w-5" />
            <span className="relative z-10">{t.ui.more}</span>
          </button>
        </nav>
      </div>
    </>
  );
}
