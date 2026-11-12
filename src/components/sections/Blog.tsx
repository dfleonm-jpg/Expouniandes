"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2, Newspaper, Plus } from "lucide-react";
import { useBlogT } from "@/lib/blog-i18n";
import { useAuth } from "@/lib/auth-context";
import {
  createPost,
  deletePost,
  fetchPosts,
  updatePost,
  type BlogCursor,
} from "@/lib/blog-store";
import type { BlogPost } from "@/lib/blog-types";
import { SectionHeader } from "../ui/SectionHeader";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useToast } from "../ui/Toast";
import { BlogComposer } from "./BlogComposer";
import { BlogPostCard } from "./BlogPostCard";

type Composer = { mode: "create" } | { mode: "edit"; post: BlogPost } | null;

export function Blog() {
  const t = useBlogT();
  const { user, enabled } = useAuth();
  const { notify } = useToast();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [cursor, setCursor] = useState<BlogCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [composer, setComposer] = useState<Composer>(null);
  const [toDelete, setToDelete] = useState<BlogPost | null>(null);

  const uid = user?.uid ?? null;
  const canUse = enabled && !!uid;

  // Primera página (y reintentos). Se ignora el resultado si se desmonta.
  useEffect(() => {
    if (!canUse) return;
    let active = true;
    fetchPosts()
      .then((page) => {
        if (!active) return;
        setPosts(page.items);
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
  }, [canUse, reloadKey]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchPosts(cursor);
      setPosts((prev) => [...prev, ...page.items.filter((p) => !prev.some((x) => x.id === p.id))]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch {
      notify("error", t.errorLoad);
    } finally {
      setLoadingMore(false);
    }
  }

  // Los errores se propagan al modal, que los muestra junto al formulario.
  async function handleSubmit(title: string, content: string) {
    if (!user || !composer) return;
    if (composer.mode === "create") {
      const created = await createPost({ uid: user.uid, name: user.name, photo: user.photo }, title, content);
      setPosts((prev) => [created, ...prev]);
      notify("success", t.published);
    } else {
      const id = composer.post.id;
      await updatePost(id, title, content);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, title: title.trim(), content: content.trim(), updatedAt: Date.now() } : p))
      );
      notify("success", t.updated);
    }
    setComposer(null);
  }

  async function confirmDelete() {
    const post = toDelete;
    if (!post) return;
    setToDelete(null);
    try {
      await deletePost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      notify("success", t.deleted);
    } catch {
      notify("error", t.errorDelete);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-nav">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader icon={Newspaper} title={t.title} subtitle={t.subtitle} />
        {canUse && (
          <button
            onClick={() => setComposer({ mode: "create" })}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> {t.newPost}
          </button>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {!enabled ? (
          <div className="glass rounded-3xl p-10 text-center text-muted">{t.noCloud}</div>
        ) : !user ? (
          <div className="glass rounded-3xl p-10 text-center text-muted">{t.loginNote}</div>
        ) : status === "loading" ? (
          <div role="status" className="glass flex items-center justify-center gap-2 rounded-3xl p-12 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" /> {t.loading}
          </div>
        ) : status === "error" ? (
          <div role="alert" className="glass rounded-3xl p-10 text-center">
            <p className="text-danger">{t.errorLoad}</p>
            <button
              onClick={() => {
                setStatus("loading");
                setReloadKey((k) => k + 1);
              }}
              className="glass mt-4 rounded-xl px-4 py-2 text-sm font-medium transition hover:bg-white/10"
            >
              {t.retry}
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center text-muted">{t.empty}</div>
        ) : (
          <>
            {posts.map((p) => (
              <BlogPostCard
                key={p.id}
                post={p}
                user={user}
                onEdit={(post) => setComposer({ mode: "edit", post })}
                onDelete={setToDelete}
              />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="glass mx-auto flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.loadMore}
              </button>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {composer && (
          <BlogComposer
            key={composer.mode === "edit" ? composer.post.id : "new"}
            mode={composer.mode}
            initialTitle={composer.mode === "edit" ? composer.post.title : ""}
            initialContent={composer.mode === "edit" ? composer.post.content : ""}
            onSubmit={handleSubmit}
            onCancel={() => setComposer(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={toDelete !== null}
        danger
        title={t.deletePostTitle}
        body={t.deletePostBody}
        confirmLabel={t.confirmDelete}
        cancelLabel={t.cancel}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
