"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, User, Sparkles, FileText, Trash2, Copy, Square, Eraser, Globe, Mic } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useToast } from "../ui/Toast";
import { useVoiceInput } from "@/lib/useVoiceInput";
import { SectionHeader } from "../ui/SectionHeader";
import { FileUploadButton } from "../ui/FileUploadButton";
import { SpeakButton } from "../ui/SpeakButton";
import { RichText } from "../ui/RichText";
import { cn } from "@/lib/utils";

type Source = { title: string; url: string };
type Message = { id: string; role: "user" | "model"; text: string; sources?: Source[] };

export function Tutor() {
  const { t, locale, addStat, docs, addDoc, removeDoc } = useApp();
  const { notify } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [searching, setSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const atBottomRef = useRef(true);
  const voice = useVoiceInput(locale, (text) => setInput((prev) => (prev ? prev + " " + text : text)));

  // Solo auto-scroll si el usuario ya estaba al final (no interrumpe lectura).
  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function stop() {
    abortRef.current?.abort();
    setLoading(false);
  }

  function clearChat() {
    stop();
    setMessages([]);
    notify("info", t.ui.cleared);
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify("success", t.ui.copied);
    } catch {
      notify("error", t.common.error);
    }
  }

  useEffect(() => {
    if (atBottomRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const newMessages: Message[] = [...messages, { id: crypto.randomUUID(), role: "user", text: content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    addStat("questionsAnswered", 1);

    // Une los documentos como contexto para el tutor.
    let context = docs.map((d) => `### ${d.name}\n${d.content}`).join("\n\n");
    let sources: { title: string; url: string }[] = [];

    // Si está activada la búsqueda web, trae resultados de internet.
    if (webSearch) {
      setSearching(true);
      try {
        const r = await fetch("/api/web-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: content, locale }),
        });
        if (r.ok) {
          const data = await r.json();
          const results = (data.results ?? []) as { title: string; url: string; snippet: string }[];
          sources = results.map((x) => ({ title: x.title, url: x.url }));
          if (results.length) {
            const web = results
              .map((x, i) => `[${i + 1}] ${x.title}\n${x.snippet}\n(${x.url})`)
              .join("\n\n");
            context += `\n\nRESULTADOS DE BÚSQUEDA EN INTERNET (úsalos para responder y cita las fuentes como [1], [2]...):\n${web}`;
          }
        }
      } catch {
        /* si falla la web, se responde igual con conocimiento general */
      }
      setSearching(false);
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, locale, context }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const payload = await res.json().catch(() => ({}));
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "model", text: `⚠️ ${payload.error || t.common.error}` }]);
        return;
      }

      const modelId = crypto.randomUUID();
      setMessages((m) => [...m, { id: modelId, role: "model", text: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => m.map((msg) => (msg.id === modelId ? { ...msg, text: acc } : msg)));
      }
      if (!acc.trim()) {
        setMessages((m) => m.map((msg) => (msg.id === modelId ? { ...msg, text: `⚠️ ${t.common.error}` } : msg)));
      } else if (sources.length) {
        setMessages((m) => m.map((msg) => (msg.id === modelId ? { ...msg, sources } : msg)));
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "model", text: `⚠️ ${t.common.error}` }]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-11rem)] max-w-4xl flex-col px-4 pb-24 lg:h-[calc(100dvh-6rem)] lg:pb-4">
      <div className="flex items-center justify-between gap-3">
        <SectionHeader icon={Brain} title={t.tutor.title} subtitle={t.tutor.subtitle} />
        <div className="flex shrink-0 items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition hover:bg-white/10"
            >
              <Eraser className="h-4 w-4 text-danger" />
              <span className="hidden sm:inline">{t.ui.clear}</span>
            </button>
          )}
          <FileUploadButton onExtracted={(name, text) => addDoc(name, text)} compact />
        </div>
      </div>

      {/* Documentos activos */}
      {docs.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">
            <FileText className="mr-1 inline h-3.5 w-3.5" />
            {t.documents.useInTutor}
          </span>
          {docs.map((d) => (
            <span key={d.id} className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs">
              {d.name.length > 24 ? d.name.slice(0, 24) + "…" : d.name}
              <button onClick={() => removeDoc(d.id)} className="text-muted transition hover:text-danger">
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Mensajes */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
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
              {messages.map((m) => (
                <motion.div
                  key={m.id}
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
                  <div className="group/msg max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        m.role === "user" ? "bg-brand/90 text-white" : "glass text-foreground/90"
                      }`}
                    >
                      {m.text ? (
                        <RichText>{m.text}</RichText>
                      ) : (
                        <TypingDots />
                      )}
                    </div>
                    {/* Fuentes de internet */}
                    {m.role === "model" && m.sources && m.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Globe className="h-3 w-3 text-accent" />
                          {t.ui.sources}:
                        </span>
                        {m.sources.map((s, i) => (
                          <a
                            key={i}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={s.title}
                            className="glass max-w-[160px] truncate rounded-full px-2 py-0.5 text-xs text-accent transition hover:bg-white/10"
                          >
                            [{i + 1}] {hostOf(s.url)}
                          </a>
                        ))}
                      </div>
                    )}
                    {m.role === "model" && m.text && !m.text.startsWith("⚠️") && (
                      <div className="mt-1.5 flex items-center gap-3 opacity-0 transition group-hover/msg:opacity-100">
                        <button
                          onClick={() => copyText(m.text)}
                          className="flex items-center gap-1 text-xs text-muted transition hover:text-foreground"
                        >
                          <Copy className="h-3 w-3" />
                          {t.ui.copy}
                        </button>
                        <SpeakButton text={m.text} label="🔊" />
                      </div>
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
                <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3">
                  {searching ? (
                    <span className="flex items-center gap-2 text-sm text-muted">
                      <Globe className="h-4 w-4 animate-pulse text-accent" />
                      {t.ui.webSearching}
                    </span>
                  ) : (
                    <TypingDots />
                  )}
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
        <button
          type="button"
          onClick={() => setWebSearch((w) => !w)}
          title={t.ui.webSearch}
          aria-pressed={webSearch}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
            webSearch ? "bg-accent/25 text-accent ring-1 ring-accent/40" : "text-muted hover:bg-white/10"
          )}
        >
          <Globe className="h-5 w-5" />
        </button>
        {voice.supported && (
          <button
            type="button"
            onClick={voice.toggle}
            title={t.ui.voiceInput}
            aria-pressed={voice.listening}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
              voice.listening ? "bg-danger/25 text-danger ring-1 ring-danger/40 animate-pulse" : "text-muted hover:bg-white/10"
            )}
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
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
        {loading ? (
          <button
            type="button"
            onClick={stop}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger/90 text-white transition hover:opacity-90"
            aria-label={t.ui.stop}
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-white transition hover:opacity-90 disabled:opacity-40"
            aria-label={t.tutor.send}
          >
            <Send className="h-5 w-5" />
          </button>
        )}
      </form>
    </div>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 20);
  }
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
