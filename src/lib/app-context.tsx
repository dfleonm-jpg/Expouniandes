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
