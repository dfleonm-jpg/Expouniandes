"use client";

import { motion } from "framer-motion";
import { Brain, MessageSquare, ListChecks, Clock, HeartPulse, BarChart3 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";
import { cn } from "@/lib/utils";

export type Section = "home" | "tutor" | "quiz" | "planner" | "wellbeing" | "progress";

const NAV_ITEMS: { id: Section; icon: typeof MessageSquare; key: keyof ReturnType<typeof useApp>["t"]["nav"] }[] = [
  { id: "tutor", icon: MessageSquare, key: "tutor" },
  { id: "quiz", icon: ListChecks, key: "quiz" },
  { id: "planner", icon: Clock, key: "planner" },
  { id: "wellbeing", icon: HeartPulse, key: "wellbeing" },
  { id: "progress", icon: BarChart3, key: "progress" },
];

export function Navbar({
  active,
  onNavigate,
}: {
  active: Section;
  onNavigate: (s: Section) => void;
}) {
  const { t } = useApp();

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav className="glass-strong mx-auto mt-3 flex max-w-6xl items-center justify-between gap-2 rounded-2xl px-3 py-2.5 sm:px-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex shrink-0 items-center gap-2.5 transition hover:opacity-80"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent">
            <Brain className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            {t.brand}
          </span>
        </button>

        {/* Links desktop */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition",
                  isActive ? "text-white" : "text-muted hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-white/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{t.nav[item.key]}</span>
              </button>
            );
          })}
        </div>

        <LanguageSwitcher />
      </nav>

      {/* Nav móvil inferior */}
      <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div className="glass-strong mx-3 mb-3 flex items-center justify-around rounded-2xl px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition",
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
    </header>
  );
}
