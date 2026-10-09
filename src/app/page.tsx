"use client";

import { useState } from "react";
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
import { Wellbeing } from "@/components/sections/Wellbeing";
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

export default function Page() {
  const [section, setSection] = useState<Section>("home");

  function navigate(s: Section) {
    setSection(s);
    window.scrollTo({ top: 0 });
  }

  // Secciones con estado que NO debe perderse al navegar (se mantienen montadas).
  const stateful: Section[] = ["tutor", "quiz", "exam", "flashcards"];

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

        {/* Secciones ligeras (animadas) */}
        {!stateful.includes(section) && (
          <AnimatePresence mode="wait">
            <Fade key={section}>
              {section === "home" && <Home onNavigate={navigate} />}
              {section === "search" && <Search onNavigate={navigate} />}
              {section === "summary" && <Summary />}
              {section === "planner" && <Planner />}
              {section === "wellbeing" && <Wellbeing />}
              {section === "progress" && <Progress />}
            </Fade>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
