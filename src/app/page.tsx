"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Landing } from "@/components/Landing";
import { Sidebar, type Section } from "@/components/Sidebar";
import { AIStatusBanner } from "@/components/ui/AIStatusBanner";
import { Home } from "@/components/sections/Home";
import { Tutor } from "@/components/sections/Tutor";
import { Quiz } from "@/components/sections/Quiz";
import { Exam } from "@/components/sections/Exam";
import { Search } from "@/components/sections/Search";
import { Flashcards } from "@/components/sections/Flashcards";
import { Summary } from "@/components/sections/Summary";
import { MindMap } from "@/components/sections/MindMap";
import { Methods } from "@/components/sections/Methods";
import { CodePractice } from "@/components/sections/CodePractice";
import { MathPractice } from "@/components/sections/MathPractice";
import { Planner } from "@/components/sections/Planner";
import { Calendar } from "@/components/sections/Calendar";
import { Groups } from "@/components/sections/Groups";
import { Wellbeing } from "@/components/sections/Wellbeing";
import { Support } from "@/components/sections/Support";
import { Diagnostic } from "@/components/sections/Diagnostic";
import { Progress } from "@/components/sections/Progress";
import { Ranking } from "@/components/sections/Ranking";
import { Profile } from "@/components/sections/Profile";

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
  "4": "flashcards",
  "5": "mindmap",
  "6": "methods",
  "7": "planner",
  "8": "calendar",
  "9": "wellbeing",
  "0": "support",
};

export default function Page() {
  const [section, setSection] = useState<Section>("home");
  const auth = useAuth();

  function navigate(s: Section) {
    setSection(s);
    window.scrollTo({ top: 0 });
  }

  // Login OBLIGATORIO: si Firebase está activo, se exige iniciar sesión para
  // acceder al tutor y a las herramientas. Mientras no haya sesión, se ve la landing.
  // (Si por alguna razón Firebase no estuviera configurado, se permite el acceso
  //  para no bloquear la app por completo.)
  const showLanding = auth.enabled && !auth.loading && !auth.user;

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
  const stateful: Section[] = ["tutor", "quiz", "exam", "flashcards", "support", "codePractice", "mathPractice"];

  // Mientras Firebase resuelve si hay sesión, evita parpadeo.
  if (auth.enabled && auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="aurora-bg" />
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-brand" />
      </div>
    );
  }

  if (showLanding) {
    return <Landing />;
  }

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
        <Keep active={section === "codePractice"}>
          <CodePractice />
        </Keep>
        <Keep active={section === "mathPractice"}>
          <MathPractice />
        </Keep>

        {/* Secciones ligeras (animadas) */}
        {!stateful.includes(section) && (
          <AnimatePresence mode="wait">
            <Fade key={section}>
              {section === "home" && <Home onNavigate={navigate} />}
              {section === "search" && <Search onNavigate={navigate} />}
              {section === "summary" && <Summary />}
              {section === "mindmap" && <MindMap />}
              {section === "methods" && <Methods onNavigate={navigate} />}
              {section === "planner" && <Planner />}
              {section === "calendar" && <Calendar />}
              {section === "groups" && <Groups />}
              {section === "wellbeing" && <Wellbeing />}
              {section === "diagnostic" && <Diagnostic />}
              {section === "progress" && <Progress />}
              {section === "ranking" && <Ranking />}
              {section === "profile" && <Profile />}
            </Fade>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
