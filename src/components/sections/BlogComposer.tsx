"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useBlogT } from "@/lib/blog-i18n";
import { useModalA11y } from "@/lib/useModalA11y";
import { BLOG_LIMITS, validatePost } from "@/lib/blog-store";

/** Modal para crear o editar una publicación. */
export function BlogComposer({
  mode,
  initialTitle = "",
  initialContent = "",
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initialTitle?: string;
  initialContent?: string;
  onSubmit: (title: string, content: string) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useBlogT();
  const ref = useModalA11y(true, onCancel);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalid = validatePost(title, content);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (invalid === "title") return setError(t.errorTitle.replace("{n}", String(BLOG_LIMITS.title)));
    if (invalid === "content") return setError(t.errorContent.replace("{n}", String(BLOG_LIMITS.content)));
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(title, content);
    } catch {
      setError(mode === "edit" ? t.errorEdit : t.errorPublish);
      setSubmitting(false);
    }
  }

  const heading = mode === "edit" ? t.editPost : t.newPost;
  const field =
    "glass w-full rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center sm:p-4"
      onClick={() => !submitting && onCancel()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        className="glass-strong glow-border relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl sm:p-6"
      >
        <form onSubmit={submit}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{heading}</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            aria-label={t.close}
            className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="blog-title" className="mb-1 block text-sm font-medium">
              {t.titleLabel}
            </label>
            <input
              id="blog-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={BLOG_LIMITS.title}
              placeholder={t.titlePlaceholder}
              className={field}
            />
            <p className="mt-1 text-right text-[11px] tabular-nums text-muted">
              {title.length}/{BLOG_LIMITS.title}
            </p>
          </div>
          <div>
            <label htmlFor="blog-content" className="mb-1 block text-sm font-medium">
              {t.contentLabel}
            </label>
            <textarea
              id="blog-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={BLOG_LIMITS.content}
              rows={8}
              placeholder={t.contentPlaceholder}
              className={`${field} resize-y`}
            />
            <p className="mt-1 text-right text-[11px] tabular-nums text-muted">
              {content.length}/{BLOG_LIMITS.content}
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="glass flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={submitting || invalid !== null}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "edit"
              ? submitting ? t.saving : t.save
              : submitting ? t.publishing : t.publish}
          </button>
        </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
