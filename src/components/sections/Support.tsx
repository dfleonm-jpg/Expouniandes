"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartHandshake, Send, Heart, Info, Phone } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";
import { RichText } from "../ui/RichText";

type Message = { id: string; role: "user" | "model"; text: string };

export function Support() {
  const { t, locale } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  useEffect(() => {
    if (atBottomRef.current) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: Message[] = [...messages, { id: crypto.randomUUID(), role: "user", text: content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, locale }),
      });
      if (!res.ok || !res.body) {
        const p = await res.json().catch(() => ({}));
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "model", text: `⚠️ ${p.error || t.common.error}` }]);
        return;
      }
      const id = crypto.randomUUID();
      setMessages((m) => [...m, { id, role: "model", text: "" }]);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, text: acc } : msg)));
      }
    } catch {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "model", text: `⚠️ ${t.common.error}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-11rem)] max-w-3xl flex-col px-4 pb-24 lg:h-[calc(100dvh-6rem)] lg:pb-4">
      <SectionHeader icon={HeartHandshake} title={t.support.title} subtitle={t.support.subtitle} />

      {/* Aviso responsable */}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-xs text-foreground/80 ring-1 ring-accent/20">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p>{t.support.disclaimer}</p>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} onScroll={onScroll} className="glass mt-4 flex-1 overflow-y-auto rounded-3xl p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <p className="mb-6 text-muted">{t.support.empty}</p>
            <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {t.support.starters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="glass rounded-2xl px-4 py-3 text-left text-sm text-foreground/80 transition hover:bg-white/10"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      m.role === "user" ? "bg-white/10" : "bg-gradient-to-br from-rose-500 to-pink-500"
                    }`}
                  >
                    {m.role === "user" ? "🧑" : <Heart className="h-5 w-5 text-white" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-brand/90 text-white" : "glass text-foreground/90"
                    }`}
                  >
                    {m.text ? <RichText>{m.text}</RichText> : <span className="text-muted">{t.support.thinking}</span>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && messages[messages.length - 1]?.role === "user" && (
              <p className="pl-12 text-sm text-muted">{t.support.thinking}</p>
            )}
          </div>
        )}
      </div>

      {/* Líneas de ayuda */}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-500/10 p-3 text-xs ring-1 ring-rose-500/20">
        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
        <div>
          <p className="font-semibold text-foreground">{t.support.crisisTitle}</p>
          <p className="text-foreground/70">{t.support.crisisLines}</p>
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="glass-strong mt-3 flex items-end gap-2 rounded-2xl p-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={t.support.placeholder}
          rows={1}
          className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white transition hover:opacity-90 disabled:opacity-40"
          aria-label={t.support.send}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
