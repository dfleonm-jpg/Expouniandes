"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, MoreHorizontal, Pencil, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useBlogT, formatBlogDate } from "@/lib/blog-i18n";
import type { SerenoUser } from "@/lib/auth-context";
import { fetchPostStats, nextReaction, setReaction } from "@/lib/blog-store";
import type { BlogPost, BlogPostStats, BlogReaction } from "@/lib/blog-types";
import { cn } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { useToast } from "../ui/Toast";
import { BlogComments } from "./BlogComments";

/** Aplica un cambio de reacción a los totales (quita la anterior, suma la nueva). */
function withReaction(s: BlogPostStats, next: BlogReaction | null): BlogPostStats {
  const out = { ...s, mine: next };
  if (s.mine === "like") out.likes = Math.max(0, out.likes - 1);
  if (s.mine === "dislike") out.dislikes = Math.max(0, out.dislikes - 1);
  if (next === "like") out.likes += 1;
  if (next === "dislike") out.dislikes += 1;
  return out;
}

export function BlogPostCard({
  post,
  user,
  onEdit,
  onDelete,
}: {
  post: BlogPost;
  user: SerenoUser;
  onEdit: (post: BlogPost) => void;
  onDelete: (post: BlogPost) => void;
}) {
  const { locale } = useApp();
  const t = useBlogT();
  const { notify } = useToast();
  const isOwner = post.authorUid === user.uid;
  const edited = post.updatedAt - post.createdAt > 1500;

  const [stats, setStats] = useState<BlogPostStats | null>(null);
  const [reacting, setReacting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Totales y reacción propia, calculados desde los documentos en Firestore.
  useEffect(() => {
    let active = true;
    fetchPostStats(post.id, user.uid)
      .then((s) => {
        if (active) setStats(s);
      })
      .catch(() => {
        // Si falla, la tarjeta sigue legible; los totales quedan en 0 sin romper la UI.
        if (active) setStats({ likes: 0, dislikes: 0, comments: 0, mine: null });
      });
    return () => {
      active = false;
    };
  }, [post.id, user.uid]);

  // Cierra el menú al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function react(kind: BlogReaction) {
    if (!stats || reacting) return;
    const previous = stats.mine;
    const next = nextReaction(previous, kind);
    // Actualización optimista; se revierte si la escritura falla.
    setStats((s) => (s ? withReaction(s, next) : s));
    setReacting(true);
    try {
      await setReaction(post.id, user.uid, next);
    } catch {
      setStats((s) => (s ? withReaction(s, previous) : s));
      notify("error", t.errorReact);
      setReacting(false);
      return;
    }
    setReacting(false);
    // Resincroniza con la fuente de verdad (incluye reacciones de otras personas).
    fetchPostStats(post.id, user.uid)
      .then(setStats)
      .catch(() => {});
  }

  const reactBtn = (kind: BlogReaction, Icon: typeof ThumbsUp, label: string, count: number | null) => {
    const selected = stats?.mine === kind;
    return (
      <button
        onClick={() => react(kind)}
        disabled={!stats || reacting}
        aria-pressed={selected}
        aria-label={label}
        title={label}
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition disabled:opacity-60",
          selected
            ? kind === "like"
              ? "bg-calm/20 text-calm ring-1 ring-calm/40"
              : "bg-danger/20 text-danger ring-1 ring-danger/40"
            : "glass text-muted hover:text-foreground"
        )}
      >
        <Icon className={cn("h-4 w-4", selected && "fill-current")} />
        <span className="tabular-nums">{count ?? "–"}</span>
      </button>
    );
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass rounded-3xl p-4 sm:p-6"
    >
      <header className="flex items-start gap-3">
        <Avatar name={post.authorName} photo={post.authorPhoto} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {post.authorName || t.anonymous}{" "}
            {isOwner && <span className="text-xs font-normal text-brand">({t.you})</span>}
          </p>
          <p className="text-xs text-muted">
            {formatBlogDate(post.createdAt, locale)}
            {edited && <> · {t.edited}</>}
          </p>
        </div>

        {isOwner && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={t.moreActions}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div role="menu" className="glass-strong absolute right-0 top-full z-20 mt-1 w-40 rounded-xl p-1 shadow-xl">
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(post);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10"
                >
                  <Pencil className="h-4 w-4" /> {t.edit}
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(post);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition hover:bg-white/10"
                >
                  <Trash2 className="h-4 w-4" /> {t.delete}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <h2 className="mt-4 break-words text-lg font-bold tracking-tight sm:text-xl">{post.title}</h2>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90 sm:text-base">
        {post.content}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {reactBtn("like", ThumbsUp, t.like, stats ? stats.likes : null)}
        {reactBtn("dislike", ThumbsDown, t.dislike, stats ? stats.dislikes : null)}
        <button
          onClick={() => setShowComments((s) => !s)}
          aria-expanded={showComments}
          aria-label={showComments ? t.hideComments : t.showComments}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition",
            showComments ? "bg-brand/20 text-brand ring-1 ring-brand/40" : "glass text-muted hover:text-foreground"
          )}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{stats ? stats.comments : "–"}</span>
          <span className="hidden sm:inline">{t.comments}</span>
        </button>
      </div>

      {showComments && (
        <BlogComments
          postId={post.id}
          user={user}
          onCountChange={(delta) =>
            setStats((s) => (s ? { ...s, comments: Math.max(0, s.comments + delta) } : s))
          }
        />
      )}
    </motion.article>
  );
}
