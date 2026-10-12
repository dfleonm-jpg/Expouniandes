"use client";

import { motion } from "framer-motion";
import {
  Brain,
  MessageSquare,
  ListChecks,
  GraduationCap,
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
} from "lucide-react";
import { LogOut } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";
import { UniandesMark } from "./ui/UniandesMark";
import { cn } from "@/lib/utils";

export type Section =
  | "home"
  | "tutor"
  | "quiz"
  | "exam"
  | "search"
  | "flashcards"
  | "summary"
  | "mindmap"
  | "methods"
  | "codePractice"
  | "mathPractice"
  | "planner"
  | "calendar"
  | "groups"
  | "wellbeing"
  | "support"
  | "diagnostic"
  | "progress"
  | "ranking"
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
      { id: "flashcards", icon: Layers, key: "flashcards" },
    ],
  },
  {
    group: "science",
    items: [
      { id: "codePractice", icon: Code2, key: "codePractice" },
      { id: "mathPractice", icon: Sigma, key: "mathPractice" },
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
    ],
  },
];

// Lista plana para el nav móvil (orden recorriendo los grupos).
const FLAT: Item[] = GROUPS.flatMap((g) => g.items);

export function Sidebar({
  active,
  onNavigate,
}: {
  active: Section;
  onNavigate: (s: Section) => void;
}) {
  const { t, streak } = useApp();
  const auth = useAuth();

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col p-3 lg:flex">
        <div className="glass-strong flex h-full flex-col rounded-3xl p-4">
          {/* Logo */}
          <button
            onClick={() => onNavigate("home")}
            aria-label={t.brand}
            className="mb-5 flex shrink-0 items-center gap-3 px-2 transition hover:opacity-80"
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent">
              <Brain className="h-6 w-6 text-white" />
            </span>
            <div className="text-left">
              <p className="text-lg font-bold leading-none tracking-tight">{t.brand}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                <UniandesMark className="h-3 w-3" /> Uniandes
              </p>
            </div>
          </button>

          {/* Nav agrupado (con scroll propio) */}
          <nav className="flex-1 space-y-4 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {GROUPS.map((g) => (
              <div key={g.group}>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted/70">
                  {t.navGroups[g.group]}
                </p>
                <div className="space-y-0.5">
                  {g.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={cn(
                          "relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                          isActive ? "text-white" : "text-muted hover:text-foreground hover:bg-white/5"
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="side-pill"
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand/30 to-accent/15 ring-1 ring-brand/25 shadow-[0_0_20px_-6px_rgba(139,92,246,0.6)]"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          >
                            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand to-accent" />
                          </motion.span>
                        )}
                        <Icon className={cn("relative z-10 h-[18px] w-[18px] shrink-0 transition-colors", isActive && "text-accent")} />
                        <span className="relative z-10">{t.nav[item.key]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
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
      <header className="sticky top-0 z-40 lg:hidden">
        <div className="glass-strong mx-3 mt-3 flex items-center justify-between rounded-2xl px-3 py-2.5">
          <button onClick={() => onNavigate("home")} aria-label={t.brand} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent">
              <Brain className="h-5 w-5 text-white" />
            </span>
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

      {/* Nav inferior móvil (scrollable) */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="glass-strong mx-3 mb-3 flex items-center gap-1 overflow-x-auto rounded-2xl px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FLAT.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex min-w-[64px] flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition",
                  isActive ? "text-brand" : "text-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                {t.nav[item.key]}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
