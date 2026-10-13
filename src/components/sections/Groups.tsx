"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Copy, Download, FileText, Check, ClipboardPaste, Loader2, Hash } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "../ui/Toast";
import { useCopy } from "@/lib/useCopy";
import { SectionHeader } from "../ui/SectionHeader";
import { publishShare, fetchShare, normalizeCode } from "@/lib/share-store";

export function Groups() {
  const { t, docs, addDoc } = useApp();
  const { user, enabled } = useAuth();
  const { notify } = useToast();
  const copy = useCopy();

  const [codeInput, setCodeInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const cloudReady = enabled && !!user;

  async function shareDoc(id: string) {
    const d = docs.find((x) => x.id === id);
    if (!d) return;
    setSharingId(id);
    setGeneratedCode("");
    setCopied(false);
    try {
      // Acota el contenido para que el recurso compartido sea razonable.
      const code = await publishShare({
        type: "summary",
        title: d.name,
        data: { content: d.content.slice(0, 40000) },
        owner: user?.uid ?? null,
      });
      if (code) {
        setGeneratedCode(code);
      } else {
        notify("error", t.groups.shareError);
      }
    } catch {
      notify("error", t.groups.shareError);
    } finally {
      setSharingId(null);
    }
  }

  async function copyCode() {
    const ok = await copy(generatedCode, t.groups.codeCopied);
    if (ok) setCopied(true);
  }

  async function importCode() {
    const code = normalizeCode(codeInput);
    if (!code) {
      notify("error", t.groups.invalidCode);
      return;
    }
    setImporting(true);
    try {
      const res = await fetchShare(code);
      if (!res) {
        notify("error", t.groups.notFound);
        return;
      }
      const data = res.data as { content?: string };
      const content = data?.content ?? JSON.stringify(res.data, null, 2);
      addDoc(res.title || t.groups.typeSummary, content);
      setCodeInput("");
      notify("success", t.groups.imported);
    } catch {
      notify("error", t.groups.notFound);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-nav">
      <SectionHeader icon={Users} title={t.groups.title} subtitle={t.groups.subtitle} />

      {!cloudReady && (
        <div className="mt-4 rounded-2xl bg-warn/10 p-4 text-sm text-warn ring-1 ring-warn/20">
          {t.groups.loginNote}
        </div>
      )}

      <div className="mt-6 grid gap-5">
        {/* Unirse con código */}
        <div className="glass glow-border rounded-3xl p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <Download className="h-5 w-5 text-accent" />
            {t.groups.importTitle}
          </h3>
          <p className="mt-1 text-sm text-muted">{t.groups.importDesc}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && importCode()}
                placeholder={t.groups.importPlaceholder}
                maxLength={10}
                className="glass w-full rounded-xl py-2.5 pl-9 pr-4 font-mono text-sm uppercase tracking-widest text-foreground placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <button
              onClick={importCode}
              disabled={!codeInput.trim() || importing || !cloudReady}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardPaste className="h-4 w-4" />}
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
                    disabled={sharingId === d.id || !cloudReady}
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white/20 disabled:opacity-50"
                  >
                    {sharingId === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
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
                <div className="rounded-2xl bg-gradient-to-br from-brand/15 to-accent/10 p-5 text-center ring-1 ring-brand/30">
                  <p className="text-xs text-muted">{t.groups.yourCode}</p>
                  <p className="my-2 font-mono text-3xl font-extrabold tracking-[0.3em] text-gradient">{generatedCode}</p>
                  <button
                    onClick={copyCode}
                    className="mx-auto flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-xs font-medium transition hover:bg-white/20"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-calm" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? t.groups.codeCopied : t.groups.copyCode}
                  </button>
                  <p className="mt-3 text-xs text-muted">{t.groups.shareHint}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
