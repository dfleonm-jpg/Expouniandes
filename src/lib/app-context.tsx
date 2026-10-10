"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { type Locale, translations, type Translation } from "./i18n";

export type Stats = {
  quizzesTaken: number;
  questionsAnswered: number;
  focusMinutes: number;
  tasksDone: number;
  flashcardsReviewed: number;
  summariesCreated: number;
};

const DEFAULT_STATS: Stats = {
  quizzesTaken: 0,
  questionsAnswered: 0,
  focusMinutes: 0,
  tasksDone: 0,
  flashcardsReviewed: 0,
  summariesCreated: 0,
};

export type SereneDoc = { id: string; name: string; content: string };

export type ExamRecord = {
  id: string;
  topic: string;
  score: number;
  total: number;
  date: string; // ISO
};

type Streak = { count: number; lastDay: string };

export type ExamEvent = { id: string; subject: string; date: string }; // date = YYYY-MM-DD

export type A11y = {
  dyslexia: boolean; // fuente para dislexia + espaciado
  fontScale: number; // 0.9 .. 1.4
  highContrast: boolean;
  reduceMotion: boolean;
};

const DEFAULT_A11Y: A11y = { dyslexia: false, fontScale: 1, highContrast: false, reduceMotion: false };

type AppContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translation;
  stats: Stats;
  addStat: (key: keyof Stats, amount: number) => void;
  docs: SereneDoc[];
  addDoc: (name: string, content: string) => void;
  removeDoc: (id: string) => void;
  streak: number;
  userName: string;
  setUserName: (name: string) => void;
  examHistory: ExamRecord[];
  addExamRecord: (rec: Omit<ExamRecord, "id" | "date">) => void;
  examEvents: ExamEvent[];
  addExamEvent: (subject: string, date: string) => void;
  removeExamEvent: (id: string) => void;
  a11y: A11y;
  setA11y: (patch: Partial<A11y>) => void;
};

const AppContext = createContext<AppContextType | null>(null);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [docs, setDocs] = useState<SereneDoc[]>([]);
  const [streak, setStreak] = useState(0);
  const [userName, setUserNameState] = useState("");
  const [examHistory, setExamHistory] = useState<ExamRecord[]>([]);
  const [examEvents, setExamEvents] = useState<ExamEvent[]>([]);
  const [a11y, setA11yState] = useState<A11y>(DEFAULT_A11Y);
  const [mounted, setMounted] = useState(false);

  // Cargar preferencias guardadas.
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem("sereno:locale") as Locale | null;
      if (savedLocale && savedLocale in translations) setLocaleState(savedLocale);

      const savedStats = localStorage.getItem("sereno:stats");
      if (savedStats) setStats({ ...DEFAULT_STATS, ...JSON.parse(savedStats) });

      const savedDocs = localStorage.getItem("sereno:docs");
      if (savedDocs) setDocs(JSON.parse(savedDocs));

      const savedName = localStorage.getItem("sereno:userName");
      if (savedName) setUserNameState(savedName);

      const savedExams = localStorage.getItem("sereno:examHistory");
      if (savedExams) setExamHistory(JSON.parse(savedExams));

      const savedEvents = localStorage.getItem("sereno:examEvents");
      if (savedEvents) setExamEvents(JSON.parse(savedEvents));

      const savedA11y = localStorage.getItem("sereno:a11y");
      if (savedA11y) setA11yState({ ...DEFAULT_A11Y, ...JSON.parse(savedA11y) });

      // Racha de estudio: incrementa si entra en días consecutivos.
      const rawStreak = localStorage.getItem("sereno:streak");
      const today = todayKey();
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      let s: Streak = rawStreak ? JSON.parse(rawStreak) : { count: 0, lastDay: "" };
      if (s.lastDay !== today) {
        s = { count: s.lastDay === yesterday ? s.count + 1 : 1, lastDay: today };
        localStorage.setItem("sereno:streak", JSON.stringify(s));
      }
      setStreak(s.count);
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("sereno:locale", l);
    } catch {}
  }, []);

  const addStat = useCallback((key: keyof Stats, amount: number) => {
    setStats((prev) => {
      const next = { ...prev, [key]: prev[key] + amount };
      try {
        localStorage.setItem("sereno:stats", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const addDoc = useCallback((name: string, content: string) => {
    setDocs((prev) => {
      const next = [...prev, { id: crypto.randomUUID(), name, content }];
      try {
        localStorage.setItem("sereno:docs", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeDoc = useCallback((id: string) => {
    setDocs((prev) => {
      const next = prev.filter((d) => d.id !== id);
      try {
        localStorage.setItem("sereno:docs", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    try {
      localStorage.setItem("sereno:userName", name);
    } catch {}
  }, []);

  const addExamRecord = useCallback((rec: Omit<ExamRecord, "id" | "date">) => {
    setExamHistory((prev) => {
      const next = [
        { ...rec, id: crypto.randomUUID(), date: new Date().toISOString() },
        ...prev,
      ].slice(0, 50);
      try {
        localStorage.setItem("sereno:examHistory", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const addExamEvent = useCallback((subject: string, date: string) => {
    setExamEvents((prev) => {
      const next = [...prev, { id: crypto.randomUUID(), subject, date }].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      try {
        localStorage.setItem("sereno:examEvents", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeExamEvent = useCallback((id: string) => {
    setExamEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem("sereno:examEvents", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const setA11y = useCallback((patch: Partial<A11y>) => {
    setA11yState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem("sereno:a11y", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Aplica las preferencias de accesibilidad al documento.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--font-scale", String(a11y.fontScale));
    root.classList.toggle("a11y-dyslexia", a11y.dyslexia);
    root.classList.toggle("a11y-contrast", a11y.highContrast);
    root.classList.toggle("a11y-reduce-motion", a11y.reduceMotion);
  }, [a11y]);

  const value: AppContextType = {
    locale,
    setLocale,
    t: translations[locale] as Translation,
    stats,
    addStat,
    docs,
    addDoc,
    removeDoc,
    streak,
    userName,
    setUserName,
    examHistory,
    addExamRecord,
    examEvents,
    addExamEvent,
    removeExamEvent,
    a11y,
    setA11y,
  };

  return (
    <AppContext.Provider value={value}>
      <div
        className="transition-opacity duration-300"
        style={{ opacity: mounted ? 1 : 0 }}
      >
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
