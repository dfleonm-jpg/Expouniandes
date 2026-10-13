"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useApp } from "@/lib/app-context";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * Gestiona la experiencia PWA:
 *  - Registra el service worker (offline + caché).
 *  - Prompt de instalación propio (bonito), no el genérico.
 *  - Indicador online/offline.
 *  - Aviso de actualización cuando hay una versión nueva.
 */
export function PWAManager() {
  const { t } = useApp();
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [offline, setOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const [updateReady, setUpdateReady] = useState<ServiceWorker | null>(null);

  // --- Service worker ---
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    let refreshing = false;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Detecta una nueva versión esperando para activarse.
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(nw);
            }
          });
        });
      })
      .catch(() => {});

    // Cuando el SW nuevo toma control, recarga una vez.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  // --- Install prompt ---
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BIPEvent);
      // No molestar si ya la descartó en esta sesión.
      if (sessionStorage.getItem("sereno:install-dismissed") !== "1") {
        setTimeout(() => setShowInstall(true), 4000);
      }
    };
    const onInstalled = () => {
      setShowInstall(false);
      setInstallEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // --- Online / offline ---
  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => {
      setOffline(false);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 2500);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    await installEvt.userChoice.catch(() => {});
    setShowInstall(false);
    setInstallEvt(null);
  }, [installEvt]);

  const dismissInstall = useCallback(() => {
    setShowInstall(false);
    try {
      sessionStorage.setItem("sereno:install-dismissed", "1");
    } catch {}
  }, []);

  const applyUpdate = useCallback(() => {
    updateReady?.postMessage?.("SKIP_WAITING");
    setUpdateReady(null);
  }, [updateReady]);

  const P = t.pwa;

  return (
    <>
      {/* Indicador de conexión */}
      <AnimatePresence>
        {offline && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="safe-top fixed left-1/2 top-3 z-[300] -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-full bg-danger/90 px-4 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur">
              <WifiOff className="h-3.5 w-3.5" />
              {P.offline}
            </div>
          </motion.div>
        )}
        {justReconnected && !offline && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="safe-top fixed left-1/2 top-3 z-[300] -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-full bg-calm/90 px-4 py-1.5 text-xs font-medium text-black shadow-lg backdrop-blur">
              <Wifi className="h-3.5 w-3.5" />
              {P.backOnline}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aviso de actualización */}
      <AnimatePresence>
        {updateReady && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="above-nav fixed left-1/2 z-[300] -translate-x-1/2"
          >
            <button
              onClick={applyUpdate}
              className="glass-strong flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-2xl transition hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 text-accent" />
              {P.updateReady}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt de instalación propio */}
      <AnimatePresence>
        {showInstall && installEvt && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="above-nav fixed inset-x-3 z-[290] mx-auto max-w-sm"
          >
            <div className="glass-strong glow-border relative flex items-center gap-3 rounded-2xl p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{P.installTitle}</p>
                <p className="truncate text-xs text-muted">{P.installDesc}</p>
              </div>
              <button
                onClick={install}
                className="shine shrink-0 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              >
                {P.install}
              </button>
              <button onClick={dismissInstall} aria-label={P.dismiss} className="shrink-0 text-muted transition hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
