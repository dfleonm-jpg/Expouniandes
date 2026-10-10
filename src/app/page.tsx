"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar, type Section } from "@/components/Sidebar";
import { AIStatusBanner } from "@/components/ui/AIStatusBanner";
import { Home } from "@/components/sections/Home";
import { Tutor } from "@/components/sections/Tutor";
import { Quiz } from "@/components/sections/Quiz";
import { Exam } from "@/components/sections/Exam";
import { Search } from "@/components/sections/Search";
import { Flashcards } from "@/components/sections/Flashcards";
import { Summary } from "@/components/sections/Summary";
import { Planner } from "@/components/sections/Planner";
import { Calendar } from "@/components/sections/Calendar";
import { Wellbeing } from "@/components/sections/Wellbeing";
import { Support } from "@/components/sections/Support";
import { Progress } from "@/components/sections/Progress";

/** Envoltura que mantiene la sección montada pero oculta cuando no está activa,
 *  preservando su estado interno (chat, quiz a medias, etc.). */
function Keep({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className={active ? "block" : "hidden"} aria-hidden={!active}>
      {children}
    </div>
  );
}

/** Secciones ligeras y sin estado importante: se animan al entrar. */
function Fade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

const SHORTCUTS: Record<string, Section> = {
  "1": "tutor",
  "2": "quiz",
  "3": "exam",
  "4": "search",
  "5": "flashcards",
  "6": "summary",
  "7": "planner",
  "8": "calendar",
  "9": "wellbeing",
  "0": "support",
};

export default function Page() {
  const [section, setSection] = useState<Section>("home");

  function navigate(s: Section) {
    setSection(s);
    window.scrollTo({ top: 0 });
  }

  // Atajos de teclado: 1-9 cambian de sección, "/" va a Buscar.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        navigate("search");
      } else if (SHORTCUTS[e.key]) {
        navigate(SHORTCUTS[e.key]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Secciones con estado que NO debe perderse al navegar (se mantienen montadas).
  const stateful: Section[] = ["tutor", "quiz", "exam", "flashcards", "support"];

  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar active={section} onNavigate={navigate} />

      <main className="pt-4 lg:pt-6">
        <AIStatusBanner />

        {/* Secciones persistentes (mantienen su estado) */}
        <Keep active={section === "tutor"}>
          <Tutor />
        </Keep>
        <Keep active={section === "quiz"}>
          <Quiz />
        </Keep>
        <Keep active={section === "exam"}>
          <Exam />
        </Keep>
        <Keep active={section === "flashcards"}>
          <Flashcards />
        </Keep>
        <Keep active={section === "support"}>
          <Support />
        </Keep>

        {/* Secciones ligeras (animadas) */}
        {!stateful.includes(section) && (
          <AnimatePresence mode="wait">
            <Fade key={section}>
              {section === "home" && <Home onNavigate={navigate} />}
              {section === "search" && <Search onNavigate={navigate} />}
              {section === "summary" && <Summary />}
              {section === "planner" && <Planner />}
              {section === "calendar" && <Calendar />}
              {section === "wellbeing" && <Wellbeing />}
              {section === "progress" && <Progress />}
            </Fade>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
