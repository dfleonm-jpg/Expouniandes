"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { BlogComment, BlogPost, BlogPostStats, BlogReaction } from "./blog-types";

// ============================================================
// Acceso a Firestore para el Blog.
//
//   posts/{postId}                      -> publicación
//   posts/{postId}/comments/{commentId} -> comentario
//   posts/{postId}/reactions/{uid}      -> reacción (1 doc por usuario)
//
// Los totales de Like/Dislike/comentarios NO se guardan: se calculan
// con consultas de agregación (getCountFromServer) sobre los propios
// documentos. Así el cliente nunca envía contadores y no hay carreras
// ni valores manipulables. El ID del documento de reacción es el UID,
// por lo que un usuario no puede tener dos reacciones en un post.
// ============================================================

export const BLOG_LIMITS = { title: 120, content: 5000, comment: 1000, name: 60 } as const;
export const POSTS_PAGE_SIZE = 10;
export const COMMENTS_PAGE_SIZE = 20;

export type BlogCursor = QueryDocumentSnapshot<DocumentData>;
export type Page<T> = { items: T[]; cursor: BlogCursor | null; hasMore: boolean };

export type BlogAuthor = { uid: string; name: string; photo: string | null };

function requireDb(): Firestore {
  const db = getDb();
  if (!db) throw new Error("blog/no-db");
  return db;
}

function toMillis(v: unknown): number {
  const t = v as { toMillis?: () => number } | null | undefined;
  return typeof t?.toMillis === "function" ? t.toMillis() : Date.now();
}

function mapPost(snap: { id: string; data: () => DocumentData | undefined }): BlogPost {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    authorUid: String(d.authorUid ?? ""),
    authorName: String(d.authorName ?? ""),
    authorPhoto: typeof d.authorPhoto === "string" ? d.authorPhoto : null,
    title: String(d.title ?? ""),
    content: String(d.content ?? ""),
    createdAt: toMillis(d.createdAt),
    updatedAt: toMillis(d.updatedAt),
  };
}

function mapComment(snap: { id: string; data: () => DocumentData | undefined }): BlogComment {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    authorUid: String(d.authorUid ?? ""),
    authorName: String(d.authorName ?? ""),
    authorPhoto: typeof d.authorPhoto === "string" ? d.authorPhoto : null,
    content: String(d.content ?? ""),
    createdAt: toMillis(d.createdAt),
    updatedAt: toMillis(d.updatedAt),
  };
}

// ---------- Validación (misma que aplican las reglas) ----------

export type PostValidation = "title" | "content" | null;

export function validatePost(title: string, content: string): PostValidation {
  const t = title.trim();
  const c = content.trim();
  if (t.length < 1 || t.length > BLOG_LIMITS.title) return "title";
  if (c.length < 1 || c.length > BLOG_LIMITS.content) return "content";
  return null;
}

export function validateComment(content: string): boolean {
  const c = content.trim();
  return c.length >= 1 && c.length <= BLOG_LIMITS.comment;
}

/** Resultado de pulsar un botón de reacción (ver tabla del enunciado). */
export function nextReaction(current: BlogReaction | null, clicked: BlogReaction): BlogReaction | null {
  return current === clicked ? null : clicked;
}

// ---------- Publicaciones ----------

export async function fetchPosts(cursor?: BlogCursor | null, size = POSTS_PAGE_SIZE): Promise<Page<BlogPost>> {
  const db = requireDb();
  const base = [orderBy("createdAt", "desc")];
  // Pide uno más para saber si hay otra página sin una consulta extra.
  const q = cursor
    ? query(collection(db, "posts"), ...base, startAfter(cursor), limit(size + 1))
    : query(collection(db, "posts"), ...base, limit(size + 1));
  const snap = await getDocs(q);
  const hasMore = snap.docs.length > size;
  const docs = hasMore ? snap.docs.slice(0, size) : snap.docs;
  return {
    items: docs.map(mapPost),
    cursor: docs.length ? docs[docs.length - 1] : (cursor ?? null),
    hasMore,
  };
}

export async function createPost(author: BlogAuthor, title: string, content: string): Promise<BlogPost> {
  const db = requireDb();
  const ref = await addDoc(collection(db, "posts"), {
    authorUid: author.uid,
    authorName: author.name.slice(0, BLOG_LIMITS.name),
    authorPhoto: author.photo,
    title: title.trim(),
    content: content.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Relee para obtener la marca de tiempo resuelta por el servidor.
  return mapPost(await getDoc(ref));
}

export async function updatePost(postId: string, title: string, content: string): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, "posts", postId), {
    title: title.trim(),
    content: content.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(postId: string): Promise<void> {
  const db = requireDb();
  await deleteDoc(doc(db, "posts", postId));
}

// ---------- Totales y reacciones ----------

/** Totales de un post + reacción propia, calculados desde los documentos. */
export async function fetchPostStats(postId: string, uid: string | null): Promise<BlogPostStats> {
  const db = requireDb();
  const reactions = collection(db, "posts", postId, "reactions");
  const [likes, dislikes, comments, mine] = await Promise.all([
    getCountFromServer(query(reactions, where("type", "==", "like"))),
    getCountFromServer(query(reactions, where("type", "==", "dislike"))),
    getCountFromServer(collection(db, "posts", postId, "comments")),
    uid ? getDoc(doc(reactions, uid)) : Promise.resolve(null),
  ]);
  const type = mine && mine.exists() ? mine.data().type : null;
  return {
    likes: likes.data().count,
    dislikes: dislikes.data().count,
    comments: comments.data().count,
    mine: type === "like" || type === "dislike" ? type : null,
  };
}

/** Crea/cambia la reacción (doc con ID = uid) o la retira si `type` es null. */
export async function setReaction(postId: string, uid: string, type: BlogReaction | null): Promise<void> {
  const db = requireDb();
  const ref = doc(db, "posts", postId, "reactions", uid);
  if (type === null) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { uid, type, updatedAt: serverTimestamp() });
  }
}

// ---------- Comentarios ----------

export async function fetchComments(
  postId: string,
  cursor?: BlogCursor | null,
  size = COMMENTS_PAGE_SIZE
): Promise<Page<BlogComment>> {
  const db = requireDb();
  const col = collection(db, "posts", postId, "comments");
  const q = cursor
    ? query(col, orderBy("createdAt", "asc"), startAfter(cursor), limit(size + 1))
    : query(col, orderBy("createdAt", "asc"), limit(size + 1));
  const snap = await getDocs(q);
  const hasMore = snap.docs.length > size;
  const docs = hasMore ? snap.docs.slice(0, size) : snap.docs;
  return {
    items: docs.map(mapComment),
    cursor: docs.length ? docs[docs.length - 1] : (cursor ?? null),
    hasMore,
  };
}

export async function addComment(postId: string, author: BlogAuthor, content: string): Promise<BlogComment> {
  const db = requireDb();
  const ref = await addDoc(collection(db, "posts", postId, "comments"), {
    authorUid: author.uid,
    authorName: author.name.slice(0, BLOG_LIMITS.name),
    authorPhoto: author.photo,
    content: content.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return mapComment(await getDoc(ref));
}

export async function updateComment(postId: string, commentId: string, content: string): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, "posts", postId, "comments", commentId), {
    content: content.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  const db = requireDb();
  await deleteDoc(doc(db, "posts", postId, "comments", commentId));
}
