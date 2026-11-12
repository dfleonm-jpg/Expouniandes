// Tipos compartidos del Blog.

export type BlogReaction = "like" | "dislike";

export type BlogPost = {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string | null;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

export type BlogComment = {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string | null;
  content: string;
  createdAt: number;
  updatedAt: number;
};

/** Totales de una publicación, calculados desde los documentos de reacciones/comentarios. */
export type BlogPostStats = {
  likes: number;
  dislikes: number;
  comments: number;
  /** Reacción del usuario actual (null si no ha reaccionado). */
  mine: BlogReaction | null;
};
