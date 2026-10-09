"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { type Locale, translations, type Translation } from "./i18n";

export type Stats = {
  quizzesTaken: number;
  questionsAnswered: number;
  focusMinutes: number;
  tasksDone: number;
};

const DEFAULT_STATS: Stats = {
  quizzesTaken: 0,
  questionsAnswered: 0,
  focusMinutes: 0,
  tasksDone: 0,
};

type AppContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translation;
  stats: Stats;
  addStat: (key: keyof Stats, amount: number) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [mounted, setMounted] = useState(false);

  // Cargar preferencias guardadas.
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem("sereno:locale") as Locale | null;
      if (savedLocale && savedLocale in translations) setLocaleState(savedLocale);
      const savedStats = localStorage.getItem("sereno:stats");
      if (savedStats) setStats({ ...DEFAULT_STATS, ...JSON.parse(savedStats) });
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("sereno:locale", l);
    } catch {
      /* ignore */
    }
  }, []);

  const addStat = useCallback((key: keyof Stats, amount: number) => {
    setStats((prev) => {
      const next = { ...prev, [key]: prev[key] + amount };
      try {
        localStorage.setItem("sereno:stats", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value: AppContextType = {
    locale,
    setLocale,
    t: translations[locale] as Translation,
    stats,
    addStat,
  };

  // Evita parpadeo de hidratación mostrando contenido una vez montado.
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
