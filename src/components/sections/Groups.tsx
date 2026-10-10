"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Copy, Download, FileText, Check, ClipboardPaste } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useToast } from "../ui/Toast";
import { SectionHeader } from "../ui/SectionHeader";
import { encodeShare, decodeShare } from "@/lib/share-code";

export function Groups() {
  const { t, docs, addDoc } = useApp();
  const { notify } = useToast();
  const [codeInput, setCodeInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);

  function shareDoc(id: string) {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    const code = encodeShare({ type: "summary", title: doc.name, data: { content: doc.content } });
    setGeneratedCode(code);
    setCopied(false);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      notify("success", t.groups.codeCopied);
    } catch {
      notify("error", t.common.error);
    }
  }

  function importCode() {
    const payload = decodeShare(codeInput);
    if (!payload) {
      notify("error", t.groups.invalidCode);
      return;
    }
    const data = payload.data as { content?: string };
    const content = data?.content ?? JSON.stringify(payload.data, null, 2);
    addDoc(payload.title || t.groups.typeSummary, content);
    setCodeInput("");
    notify("success", t.groups.imported);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={Users} title={t.groups.title} subtitle={t.groups.subtitle} />

      <div className="mt-6 grid gap-5">
        {/* Importar con código */}
        <div className="glass glow-border rounded-3xl p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <Download className="h-5 w-5 text-accent" />
            {t.groups.importTitle}
          </h3>
          <p className="mt-1 text-sm text-muted">{t.groups.importDesc}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder={t.groups.importPlaceholder}
              className="glass flex-1 rounded-xl px-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
            <button
              onClick={importCode}
              disabled={!codeInput.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <ClipboardPaste className="h-4 w-4" />
              {t.groups.import}
            </button>
          </div>
        </div>

        {/* Compartir mis documentos */}
        <div className="glass rounded-3xl p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <Copy className="h-5 w-5 text-brand" />
            {t.groups.shareTitle}
          </h3>
          <p className="mt-1 text-sm text-muted">{t.groups.shareDesc}</p>

          {docs.length === 0 ? (
            <p className="mt-4 rounded-xl bg-white/[0.03] p-4 text-center text-sm text-muted">
              {t.groups.nothingToShare}
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {docs.map((d) => (
                <div key={d.id} className="glass flex items-center gap-3 rounded-xl px-3 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-brand" />
                  <span className="flex-1 truncate text-sm">{d.name}</span>
                  <button
                    onClick={() => shareDoc(d.id)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white/20"
                  >
                    {t.groups.generateCode}
                  </button>
                </div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {generatedCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="rounded-xl bg-black/40 p-3">
                  <p className="mb-2 break-all font-mono text-[11px] leading-relaxed text-accent">{generatedCode}</p>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white/20"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-calm" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? t.groups.codeCopied : t.groups.copyCode}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
