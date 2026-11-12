"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Pencil, Send, Trash2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useBlogT, formatBlogDate } from "@/lib/blog-i18n";
import type { SerenoUser } from "@/lib/auth-context";
import {
  BLOG_LIMITS,
  addComment,
  deleteComment,
  fetchComments,
  updateComment,
  validateComment,
  type BlogCursor,
} from "@/lib/blog-store";
import type { BlogComment } from "@/lib/blog-types";
import { Avatar } from "../ui/Avatar";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useToast } from "../ui/Toast";

/** Hilo de comentarios de una publicación (se monta solo al expandirlo). */
export function BlogComments({
  postId,
  user,
  onCountChange,
}: {
  postId: string;
  user: SerenoUser;
  onCountChange: (delta: number) => void;
}) {
  const { locale } = useApp();
  const t = useBlogT();
  const { notify } = useToast();

  const [items, setItems] = useState<BlogComment[]>([]);
  const [cursor, setCursor] = useState<BlogCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [toDelete, setToDelete] = useState<BlogComment | null>(null);

  useEffect(() => {
    let active = true;
    fetchComments(postId)
      .then((page) => {
        if (!active) return;
        setItems(page.items);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [postId, reloadKey]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchComments(postId, cursor);
      setItems((prev) => [...prev, ...page.items.filter((c) => !prev.some((p) => p.id === c.id))]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch {
      notify("error", t.errorLoadComments);
    } finally {
      setLoadingMore(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (!validateComment(text)) {
      notify("error", t.errorCommentEmpty.replace("{n}", String(BLOG_LIMITS.comment)));
      return;
    }
    setSending(true);
    try {
      const created = await addComment(postId, { uid: user.uid, name: user.name, photo: user.photo }, text);
      // Los comentarios van en orden cronológico: el nuevo va al final.
      setItems((prev) => [...prev, created]);
      setText("");
      onCountChange(1);
      notify("success", t.commentPosted);
    } catch {
      notify("error", t.errorComment);
    } finally {
      setSending(false);
    }
  }

  function startEdit(c: BlogComment) {
    setEditingId(c.id);
    setEditText(c.content);
  }

  async function saveEdit(c: BlogComment) {
    if (savingEdit) return;
    if (!validateComment(editText)) {
      notify("error", t.errorCommentEmpty.replace("{n}", String(BLOG_LIMITS.comment)));
      return;
    }
    setSavingEdit(true);
    try {
      await updateComment(postId, c.id, editText);
      setItems((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, content: editText.trim(), updatedAt: Date.now() } : x))
      );
      setEditingId(null);
      notify("success", t.updated);
    } catch {
      notify("error", t.errorEdit);
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDelete() {
    const c = toDelete;
    if (!c) return;
    setToDelete(null);
    try {
      await deleteComment(postId, c.id);
      setItems((prev) => prev.filter((x) => x.id !== c.id));
      onCountChange(-1);
      notify("success", t.deleted);
    } catch {
      notify("error", t.errorDelete);
    }
  }

  const field =
    "glass w-full rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50";

  return (
    <section aria-label={t.comments} className="mt-4 rounded-2xl border-t border-white/10 bg-black/20 p-3 sm:p-4">
      {status === "loading" && (
        <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> {t.loadingComments}
        </p>
      )}

      {status === "error" && (
        <div className="py-3 text-center text-sm">
          <p className="text-danger">{t.errorLoadComments}</p>
          <button
            onClick={() => {
              setStatus("loading");
              setReloadKey((k) => k + 1);
            }}
            className="mt-2 rounded-lg px-3 py-1 text-brand transition hover:bg-white/10"
          >
            {t.retry}
          </button>
        </div>
      )}

      {status === "ready" && (
        <>
          {items.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted">{t.emptyComments}</p>
          ) : (
            <ul className="space-y-3">
              {items.map((c) => {
                const mine = c.authorUid === user.uid;
                const edited = c.updatedAt - c.createdAt > 1500;
                return (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5"
                  >
                    <Avatar name={c.authorName} photo={c.authorPhoto} className="h-8 w-8 text-xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {c.authorName || t.anonymous}
                        </span>
                        {mine && <span className="text-brand">({t.you})</span>}
                        <span>{formatBlogDate(c.createdAt, locale)}</span>
                        {edited && <span>· {t.edited}</span>}
                      </div>

                      {editingId === c.id ? (
                        <div className="mt-1.5 space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            maxLength={BLOG_LIMITS.comment}
                            rows={3}
                            aria-label={t.edit}
                            className={`${field} resize-y`}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              disabled={savingEdit}
                              className="glass rounded-lg px-3 py-1.5 text-xs font-medium transition hover:bg-white/10"
                            >
                              {t.cancel}
                            </button>
                            <button
                              onClick={() => saveEdit(c)}
                              disabled={savingEdit || !validateComment(editText)}
                              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand to-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                            >
                              {savingEdit && <Loader2 className="h-3 w-3 animate-spin" />}
                              {savingEdit ? t.saving : t.save}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{c.content}</p>
                      )}
                    </div>

                    {mine && editingId !== c.id && (
                      <div className="flex shrink-0 items-start gap-0.5">
                        <button
                          onClick={() => startEdit(c)}
                          aria-label={t.edit}
                          title={t.edit}
                          className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setToDelete(c)}
                          aria-label={t.delete}
                          title={t.delete}
                          className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          )}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="mx-auto mt-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-brand transition hover:bg-white/10 disabled:opacity-50"
            >
              {loadingMore && <Loader2 className="h-3 w-3 animate-spin" />}
              {t.loadMoreComments}
            </button>
          )}

          <form onSubmit={send} className="mt-4 flex items-start gap-2">
            <Avatar name={user.name} photo={user.photo} className="h-8 w-8 text-xs" />
            <div className="min-w-0 flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={BLOG_LIMITS.comment}
                rows={2}
                placeholder={t.commentPlaceholder}
                aria-label={t.commentPlaceholder}
                className={`${field} resize-none`}
              />
            </div>
            <button
              type="submit"
              disabled={sending || !validateComment(text)}
              aria-label={t.commentSend}
              title={t.commentSend}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-brand to-accent text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        danger
        title={t.deleteCommentTitle}
        body={t.deleteCommentBody}
        confirmLabel={t.confirmDelete}
        cancelLabel={t.cancel}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}
