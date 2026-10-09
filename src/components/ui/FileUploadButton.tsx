"use client";

import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useToast } from "./Toast";
import { extractText, type ExtractProgress } from "@/lib/extract-text";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export function FileUploadButton({
  onExtracted,
  compact = false,
}: {
  onExtracted: (name: string, text: string) => void;
  compact?: boolean;
}) {
  const { t } = useApp();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<ExtractProgress | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_BYTES) {
      notify("error", t.documents.tooLarge);
      return;
    }

    setBusy(true);
    setProgress({ stage: "reading" });
    try {
      const text = await extractText(file, (p) => {
        setProgress(p);
        if (p.stage === "ocr" && p.page === 1) notify("info", t.documents.ocrNote);
      });
      if (!text.trim()) {
        notify("error", t.documents.extractFailed);
        return;
      }
      onExtracted(file.name, text);
      notify("success", t.documents.added);
    } catch {
      notify("error", t.documents.extractFailed);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  const label =
    progress?.stage === "reading"
      ? t.documents.reading
      : progress?.stage === "pdf"
        ? `${t.documents.readingPdf}${progress.page ? ` (${progress.page}/${progress.totalPages})` : ""}`
        : progress?.stage === "ocr"
          ? `${t.documents.ocr}${progress.page ? ` (${progress.page}/${progress.totalPages})` : ""}`
          : t.documents.uploadFull;

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition hover:bg-white/10 disabled:opacity-70"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
        ) : (
          <Upload className="h-4 w-4 text-accent" />
        )}
        <span className={compact && !busy ? "hidden sm:inline" : ""}>{label}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,application/pdf,text/plain"
        onChange={handle}
        className="hidden"
      />
    </>
  );
}
