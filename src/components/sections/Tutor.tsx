"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useApp } from "@/lib/app-context";
import { SectionHeader } from "../ui/SectionHeader";

type Message = { role: "user" | "model"; text: string };

export function Tutor() {
  const { t, locale, addStat } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", text: content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    addStat("questionsAnswered", 1);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, locale }),
      });

      if (!res.ok || !res.body) throw new Error("error");

      setMessages((m) => [...m, { role: "model", text: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "model", text: acc };
          return copy;
        });
      }
    } catch {
      setMessages((m) => [...m, { role: "model", text: t.common.error }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col px-4 pb-24 lg:pb-6">
      <SectionHeader icon={Brain} title={t.tutor.title} subtitle={t.tutor.subtitle} />

      {/* Mensajes */}
      <div
        ref={scrollRef}
        className="glass mt-4 flex-1 overflow-y-auto rounded-3xl p-4 sm:p-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <p className="mb-6 text-muted">{t.tutor.empty}</p>
            <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {t.tutor.suggestions.map((s, i) => (
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
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      m.role === "user"
                        ? "bg-white/10"
                        : "bg-gradient-to-br from-brand to-accent"
                    }`}
                  >
                    {m.role === "user" ? (
                      <User className="h-5 w-5 text-foreground" />
                    ) : (
                      <Brain className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-brand/90 text-white"
                        : "glass text-foreground/90"
                    }`}
                  >
                    {m.text ? (
                      <div className="prose-sereno">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <TypingDots />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div className="glass rounded-2xl px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="glass-strong mt-4 flex items-end gap-2 rounded-2xl p-2"
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
          placeholder={t.tutor.placeholder}
          rows={1}
          className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-white transition hover:opacity-90 disabled:opacity-40"
          aria-label={t.tutor.send}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="typing-dot h-2 w-2 rounded-full bg-brand" />
      <span className="typing-dot h-2 w-2 rounded-full bg-brand" />
      <span className="typing-dot h-2 w-2 rounded-full bg-brand" />
    </div>
  );
}
