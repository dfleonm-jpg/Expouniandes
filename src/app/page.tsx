"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar, type Section } from "@/components/Navbar";
import { Home } from "@/components/sections/Home";
import { Tutor } from "@/components/sections/Tutor";
import { Quiz } from "@/components/sections/Quiz";
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
    <div className="min-h-screen">
      <Navbar active={section} onNavigate={navigate} />

      <main className="pt-4">
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
            {section === "planner" && <Planner />}
            {section === "wellbeing" && <Wellbeing />}
            {section === "progress" && <Progress />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
