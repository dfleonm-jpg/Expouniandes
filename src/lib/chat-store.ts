"use client";

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { getDb } from "./firebase";

export type StoredMessage = { role: "user" | "model"; text: string };
export type ChatSession = {
  id: string;
  title: string;
  messages: StoredMessage[];
  updatedAt: number;
};

// Las conversaciones viven en: users/{uid}/chats/{chatId}

export async function listChats(uid: string): Promise<ChatSession[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const q = query(collection(db, "users", uid, "chats"), orderBy("updatedAt", "desc"), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ChatSession);
  } catch (e) {
    console.error("listChats error:", e);
    return [];
  }
}

export async function saveChat(uid: string, chat: ChatSession): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await setDoc(doc(db, "users", uid, "chats", chat.id), chat);
  } catch (e) {
    console.error("saveChat error:", e);
  }
}

export async function deleteChat(uid: string, chatId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await deleteDoc(doc(db, "users", uid, "chats", chatId));
  } catch (e) {
    console.error("deleteChat error:", e);
  }
}

/** Genera un título corto a partir del primer mensaje del usuario. */
export function titleFromMessages(messages: StoredMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "Chat";
  const t = firstUser.text.trim().replace(/\s+/g, " ");
  return t.length > 42 ? t.slice(0, 42) + "…" : t;
}
