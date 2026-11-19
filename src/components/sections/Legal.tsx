"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Shield, Copyright } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";
import { cn } from "@/lib/utils";

type Tab = "terms" | "privacy" | "rights";

export function Legal() {
  const { t } = useApp();
  const L = t.legal;
  const [tab, setTab] = useState<Tab>("terms");

  const TABS: { id: Tab; icon: typeof ScrollText; label: string }[] = [
    { id: "terms", icon: ScrollText, label: L.termsTab },
    { id: "privacy", icon: Shield, label: L.privacyTab },
    { id: "rights", icon: Copyright, label: L.rightsTab },
  ];

  const blocks: Record<Tab, readonly { readonly h: string; readonly p: string }[]> = {
    terms: L.terms,
    privacy: L.privacy,
    rights: L.rights,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-nav">
      <SectionHeader icon={ScrollText} title={L.title} subtitle={L.subtitle} />

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition",
                tab === tb.id
                  ? "bg-gradient-to-r from-brand to-accent text-white"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* Aviso */}
      <p className="mt-4 rounded-xl border border-warn/20 bg-warn/5 px-4 py-2.5 text-xs text-warn">
        {L.disclaimer}
      </p>

      {/* Contenido */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="mt-4 space-y-5"
        >
          {blocks[tab].map((b, i) => (
            <div key={i}>
              <h3 className="mb-1 font-semibold text-foreground">{b.h}</h3>
              <p className="text-sm leading-relaxed text-foreground/80">{b.p}</p>
            </div>
          ))}
          <p className="border-t border-white/5 pt-4 text-xs text-muted">{L.updated}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
