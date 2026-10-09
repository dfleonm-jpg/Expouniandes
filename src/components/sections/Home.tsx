"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageSquare, ListChecks, GraduationCap, Layers, FileText, CalendarClock, HeartPulse, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { UniandesMark } from "../ui/UniandesMark";
import type { Section } from "../Sidebar";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Home({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const { t, userName } = useApp();

  // La hora se lee solo en el cliente (evita el error de prerender).
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? t.ui.greetingMorning : hour < 19 ? t.ui.greetingAfternoon : t.ui.greetingEvening);
  }, [t]);

  const features = [
    { icon: MessageSquare, ...t.features.tutor, section: "tutor" as Section, color: "from-violet-500 to-indigo-500" },
    { icon: ListChecks, ...t.features.quiz, section: "quiz" as Section, color: "from-cyan-500 to-blue-500" },
    { icon: GraduationCap, title: t.exam.title, desc: t.exam.subtitle, section: "exam" as Section, color: "from-indigo-500 to-blue-600" },
    { icon: Layers, title: t.nav.flashcards, desc: t.flashcards.subtitle, section: "flashcards" as Section, color: "from-amber-500 to-orange-500" },
    { icon: FileText, title: t.nav.summary, desc: t.summary.subtitle, section: "summary" as Section, color: "from-fuchsia-500 to-purple-500" },
    { icon: CalendarClock, ...t.features.planner, section: "planner" as Section, color: "from-emerald-500 to-teal-500" },
    { icon: HeartPulse, ...t.features.wellbeing, section: "wellbeing" as Section, color: "from-rose-500 to-pink-500" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:pt-16">
      {/* Hero */}
      <motion.div variants={container} initial="hidden" animate="show" className="text-center">
        <motion.div variants={item} className="mb-6 flex justify-center">
          <span className="glass glow-border inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-foreground/80">
            <UniandesMark className="h-4 w-4" />
            {t.hero.badge}
            <Sparkles className="h-3.5 w-3.5 text-accent" />
          </span>
        </motion.div>

        {userName && greeting && (
          <motion.p variants={item} className="mb-3 text-lg font-medium text-accent">
            {greeting}, {userName} 👋
          </motion.p>
        )}

        <motion.h1
          variants={item}
          className="mx-auto max-w-3xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          {t.hero.title}{" "}
          <span className="text-gradient">{t.hero.titleAccent}</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted sm:text-xl"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div variants={item} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate("tutor")}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-accent px-6 py-3 font-semibold text-white shadow-lg shadow-brand/25 transition hover:shadow-xl hover:shadow-brand/40"
          >
            {t.hero.cta}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => onNavigate("quiz")}
            className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-foreground transition hover:bg-white/10"
          >
            {t.hero.ctaSecondary}
          </button>
        </motion.div>
      </motion.div>

      {/* Features */}
      <div className="mt-24 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold tracking-tight sm:text-4xl"
        >
          {t.features.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-3 max-w-xl text-muted"
        >
          {t.features.subtitle}
        </motion.p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <motion.button
              key={f.section}
              variants={item}
              onClick={() => onNavigate(f.section)}
              whileHover={{ y: -4 }}
              className="glass group relative overflow-hidden rounded-3xl p-7 text-left transition hover:bg-white/[0.055]"
            >
              <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color}`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-muted">{f.desc}</p>
              <ArrowRight className="absolute right-6 top-7 h-5 w-5 text-muted opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
