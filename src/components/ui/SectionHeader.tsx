"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3"
    >
      <div className="metal flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-brand">
        <Icon className="relative z-10 h-5 w-5" />
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </motion.div>
  );
}
