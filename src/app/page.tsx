"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar, type Section } from "@/components/Sidebar";
import { Home } from "@/components/sections/Home";
import { Tutor } from "@/components/sections/Tutor";
import { Quiz } from "@/components/sections/Quiz";
import { Flashcards } from "@/components/sections/Flashcards";
import { Summary } from "@/components/sections/Summary";
import { Planner } from "@/components/sections/Planner";
import { Wellbeing } from "@/components/sections/Wellbeing";
import { Progress } from "@/components/sections/Progress";

export default function Page() {
  const [section, setSection] = useState<Section>("home");

  function navigate(s: Section) {
    setSection(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar active={section} onNavigate={navigate} />

      <main className="pt-4 lg:pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {section === "home" && <Home onNavigate={navigate} />}
            {section === "tutor" && <Tutor />}
            {section === "quiz" && <Quiz />}
            {section === "flashcards" && <Flashcards />}
            {section === "summary" && <Summary />}
            {section === "planner" && <Planner />}
            {section === "wellbeing" && <Wellbeing />}
            {section === "progress" && <Progress />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
