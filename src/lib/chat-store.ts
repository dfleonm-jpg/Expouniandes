"use client";

import { collection, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { getDb } from "./firebase";

export type StoredMessage = { role: "user" | "model"; text: string };
export type ChatSession = {
  id: string;
  title: string;
  messages: StoredMessage[];
  updatedAt: number;
};

// Las conversaciones viven en: users/{uid}/chats/{chatId}

/**
 * Lista las conversaciones guardadas, ordenadas de más reciente a más antigua.
 * Ordena en el cliente (no con orderBy) para tolerar documentos antiguos sin
 * `updatedAt` y evitar depender de índices. Propaga el error para que la UI
 * pueda avisar en vez de mostrar una lista vacía silenciosa.
 */
export async function listChats(uid: string): Promise<ChatSession[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, "users", uid, "chats"));
  return snap.docs
    .map((d) => {
      const data = d.data() as Partial<ChatSession>;
      return {
        id: data.id || d.id,
        title: data.title || "Chat",
        messages: Array.isArray(data.messages) ? data.messages : [],
        updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : 0,
      } as ChatSession;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 50);
}

export async function saveChat(uid: string, chat: ChatSession): Promise<void> {
  const db = getDb();
  if (!db) return;
  if (!chat.id) throw new Error("saveChat: falta el id del chat");
  await setDoc(doc(db, "users", uid, "chats", chat.id), chat);
}

export async function deleteChat(uid: string, chatId: string): Promise<void> {
  const db = getDb();
  if (!db || !chatId) return;
  await deleteDoc(doc(db, "users", uid, "chats", chatId));
}

/** Genera un título corto a partir del primer mensaje del usuario. */
export function titleFromMessages(messages: StoredMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "Chat";
  const t = firstUser.text.trim().replace(/\s+/g, " ");
  return t.length > 42 ? t.slice(0, 42) + "…" : t;
}
