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

  const persistDocs = useCallback((next: SereneDoc[]) => {
    setDocs(next);
    try {
      localStorage.setItem("sereno:docs", JSON.stringify(next));
    } catch {}
  }, []);

  const addDoc = useCallback(
    (name: string, content: string) => {
      persistDocs([...docs, { id: crypto.randomUUID(), name, content }]);
    },
    [docs, persistDocs]
  );

  const removeDoc = useCallback(
    (id: string) => {
      persistDocs(docs.filter((d) => d.id !== id));
    },
    [docs, persistDocs]
  );

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
  };

  return (
    <AppContext.Provider value={value}>
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>{children}</div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
