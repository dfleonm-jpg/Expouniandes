"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookMarked, Timer, Lightbulb, Repeat, NotebookPen, Network, Target, Sparkles, Loader2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAIRequest } from "@/lib/useAI";
import { SectionHeader } from "../ui/SectionHeader";
import { ErrorBanner } from "../ui/ErrorBanner";
import { RichText } from "../ui/RichText";
import type { Section } from "../Sidebar";

type Method = {
  icon: typeof Timer;
  name: string;
  desc: string;
  steps: string[];
  goodFor: string;
  color: string;
  goTo?: Section;
};

// Contenido de los métodos por idioma.
const METHODS: Record<string, Method[]> = {
  es: [
    { icon: Timer, name: "Pomodoro", color: "from-rose-500 to-pink-500", goTo: "planner", desc: "Estudia en bloques de 25 min con descansos de 5. Mantiene el foco y evita el agotamiento.", steps: ["Elige una tarea", "25 min de foco total", "5 min de descanso", "Cada 4 ciclos, descansa 15-30 min"], goodFor: "Concentración y procrastinación" },
    { icon: Lightbulb, name: "Técnica Feynman", color: "from-amber-500 to-orange-500", goTo: "tutor", desc: "Explica el tema con tus palabras como si enseñaras a un niño. Revela lo que no entiendes.", steps: ["Elige un concepto", "Explícalo simple en voz alta", "Detecta huecos", "Repasa y simplifica"], goodFor: "Comprender a fondo" },
    { icon: Repeat, name: "Repetición espaciada", color: "from-cyan-500 to-blue-500", goTo: "flashcards", desc: "Repasa en intervalos crecientes. La memoria se fija mejor con el tiempo que repitiendo seguido.", steps: ["Crea flashcards", "Repasa hoy", "Repasa en 1, 3 y 7 días", "Aumenta el intervalo si aciertas"], goodFor: "Memorizar a largo plazo" },
    { icon: NotebookPen, name: "Método Cornell", color: "from-emerald-500 to-teal-500", goTo: "summary", desc: "Divide la hoja en notas, palabras clave y resumen. Ordena y facilita el repaso.", steps: ["Columna derecha: notas", "Izquierda: preguntas/claves", "Abajo: resumen", "Repasa tapando las notas"], goodFor: "Tomar apuntes en clase" },
    { icon: Network, name: "Mapas mentales", color: "from-violet-500 to-indigo-500", goTo: "mindmap", desc: "Conecta ideas visualmente desde un concepto central. Ideal para ver el panorama completo.", steps: ["Tema al centro", "Ramas principales", "Sub-ideas y ejemplos", "Usa colores e imágenes"], goodFor: "Relacionar conceptos" },
    { icon: Target, name: "Regla 80/20", color: "from-fuchsia-500 to-purple-500", goTo: "tutor", desc: "El 20% del contenido explica el 80% del examen. Identifica y domina lo esencial primero.", steps: ["Lista los temas", "Detecta los más importantes", "Domina ese 20% clave", "Luego completa el resto"], goodFor: "Poco tiempo antes del examen" },
  ],
  en: [
    { icon: Timer, name: "Pomodoro", color: "from-rose-500 to-pink-500", goTo: "planner", desc: "Study in 25-min blocks with 5-min breaks. Keeps focus and avoids burnout.", steps: ["Pick a task", "25 min full focus", "5 min break", "Every 4 cycles, rest 15-30 min"], goodFor: "Focus & procrastination" },
    { icon: Lightbulb, name: "Feynman Technique", color: "from-amber-500 to-orange-500", goTo: "tutor", desc: "Explain the topic in your own words as if teaching a child. Reveals what you don't understand.", steps: ["Pick a concept", "Explain it simply out loud", "Spot the gaps", "Review and simplify"], goodFor: "Deep understanding" },
    { icon: Repeat, name: "Spaced Repetition", color: "from-cyan-500 to-blue-500", goTo: "flashcards", desc: "Review at growing intervals. Memory sticks better over time than cramming.", steps: ["Make flashcards", "Review today", "Review in 1, 3 and 7 days", "Increase interval when correct"], goodFor: "Long-term memory" },
    { icon: NotebookPen, name: "Cornell Method", color: "from-emerald-500 to-teal-500", goTo: "summary", desc: "Split the page into notes, cues and summary. Organizes and eases review.", steps: ["Right column: notes", "Left: questions/cues", "Bottom: summary", "Review covering the notes"], goodFor: "Taking class notes" },
    { icon: Network, name: "Mind Maps", color: "from-violet-500 to-indigo-500", goTo: "mindmap", desc: "Connect ideas visually from a central concept. Great to see the whole picture.", steps: ["Topic in the center", "Main branches", "Sub-ideas and examples", "Use colors and images"], goodFor: "Relating concepts" },
    { icon: Target, name: "80/20 Rule", color: "from-fuchsia-500 to-purple-500", goTo: "tutor", desc: "20% of the content explains 80% of the exam. Identify and master the essentials first.", steps: ["List the topics", "Spot the most important", "Master that key 20%", "Then cover the rest"], goodFor: "Little time before exam" },
  ],
  pt: [
    { icon: Timer, name: "Pomodoro", color: "from-rose-500 to-pink-500", goTo: "planner", desc: "Estude em blocos de 25 min com pausas de 5. Mantém o foco e evita o esgotamento.", steps: ["Escolha uma tarefa", "25 min de foco total", "5 min de pausa", "A cada 4 ciclos, descanse 15-30 min"], goodFor: "Concentração e procrastinação" },
    { icon: Lightbulb, name: "Técnica Feynman", color: "from-amber-500 to-orange-500", goTo: "tutor", desc: "Explique o tema com suas palavras como se ensinasse a uma criança. Revela o que você não entende.", steps: ["Escolha um conceito", "Explique simples em voz alta", "Detecte lacunas", "Revise e simplifique"], goodFor: "Compreender a fundo" },
    { icon: Repeat, name: "Repetição espaçada", color: "from-cyan-500 to-blue-500", goTo: "flashcards", desc: "Revise em intervalos crescentes. A memória fixa melhor com o tempo do que decorando seguido.", steps: ["Crie flashcards", "Revise hoje", "Revise em 1, 3 e 7 dias", "Aumente o intervalo se acertar"], goodFor: "Memorizar a longo prazo" },
    { icon: NotebookPen, name: "Método Cornell", color: "from-emerald-500 to-teal-500", goTo: "summary", desc: "Divida a folha em notas, palavras-chave e resumo. Organiza e facilita a revisão.", steps: ["Coluna direita: notas", "Esquerda: perguntas/chaves", "Abaixo: resumo", "Revise tapando as notas"], goodFor: "Fazer anotações na aula" },
    { icon: Network, name: "Mapas mentais", color: "from-violet-500 to-indigo-500", goTo: "mindmap", desc: "Conecte ideias visualmente a partir de um conceito central. Ideal para ver o todo.", steps: ["Tema no centro", "Ramos principais", "Sub-ideias e exemplos", "Use cores e imagens"], goodFor: "Relacionar conceitos" },
    { icon: Target, name: "Regra 80/20", color: "from-fuchsia-500 to-purple-500", goTo: "tutor", desc: "20% do conteúdo explica 80% da prova. Identifique e domine o essencial primeiro.", steps: ["Liste os temas", "Detecte os mais importantes", "Domine esse 20% chave", "Depois complete o resto"], goodFor: "Pouco tempo antes da prova" },
  ],
  fr: [
    { icon: Timer, name: "Pomodoro", color: "from-rose-500 to-pink-500", goTo: "planner", desc: "Étudiez par blocs de 25 min avec des pauses de 5. Maintient la concentration.", steps: ["Choisissez une tâche", "25 min de concentration", "5 min de pause", "Tous les 4 cycles, 15-30 min de repos"], goodFor: "Concentration & procrastination" },
    { icon: Lightbulb, name: "Technique Feynman", color: "from-amber-500 to-orange-500", goTo: "tutor", desc: "Expliquez le sujet avec vos mots comme à un enfant. Révèle ce que vous ne comprenez pas.", steps: ["Choisissez un concept", "Expliquez simplement à voix haute", "Repérez les lacunes", "Révisez et simplifiez"], goodFor: "Comprendre en profondeur" },
    { icon: Repeat, name: "Répétition espacée", color: "from-cyan-500 to-blue-500", goTo: "flashcards", desc: "Révisez à intervalles croissants. La mémoire retient mieux dans le temps.", steps: ["Créez des flashcards", "Révisez aujourd'hui", "Révisez à 1, 3 et 7 jours", "Augmentez l'intervalle si correct"], goodFor: "Mémoire à long terme" },
    { icon: NotebookPen, name: "Méthode Cornell", color: "from-emerald-500 to-teal-500", goTo: "summary", desc: "Divisez la page en notes, indices et résumé. Organise et facilite la révision.", steps: ["Colonne droite : notes", "Gauche : questions/indices", "Bas : résumé", "Révisez en masquant les notes"], goodFor: "Prendre des notes en cours" },
    { icon: Network, name: "Cartes mentales", color: "from-violet-500 to-indigo-500", goTo: "mindmap", desc: "Reliez les idées visuellement depuis un concept central. Idéal pour la vue d'ensemble.", steps: ["Sujet au centre", "Branches principales", "Sous-idées et exemples", "Utilisez couleurs et images"], goodFor: "Relier les concepts" },
    { icon: Target, name: "Règle 80/20", color: "from-fuchsia-500 to-purple-500", goTo: "tutor", desc: "20% du contenu explique 80% de l'examen. Identifiez et maîtrisez l'essentiel d'abord.", steps: ["Listez les sujets", "Repérez les plus importants", "Maîtrisez ces 20% clés", "Puis complétez le reste"], goodFor: "Peu de temps avant l'examen" },
  ],
};

export function Methods({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const { t, locale } = useApp();
  const { loading, error, data, run, setError } = useAIRequest<{ recommendation: string }>();
  const [situation, setSituation] = useState("");
  const methods = METHODS[locale] ?? METHODS.es;

  async function recommend() {
    if (!situation.trim()) return;
    await run("/api/method", { situation, locale });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 lg:pb-10">
      <SectionHeader icon={BookMarked} title={t.methods.title} subtitle={t.methods.subtitle} />

      {/* Recomendador con IA */}
      <div className="glass glow-border mt-6 rounded-3xl p-6">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent">
          <Sparkles className="h-4 w-4" />
          {t.methods.recommend}
        </p>
        {error && <div className="mb-3"><ErrorBanner message={error} onRetry={recommend} onDismiss={() => setError(null)} /></div>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && recommend()}
            placeholder={t.methods.recommendPlaceholder}
            className="glass flex-1 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
          <button
            onClick={recommend}
            disabled={!situation.trim() || loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? t.methods.recommending : t.methods.recommendBtn}
          </button>
        </div>
        {data?.recommendation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-xl bg-white/[0.04] p-4">
            <RichText>{data.recommendation}</RichText>
          </motion.div>
        )}
      </div>

      {/* Tarjetas de métodos */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {methods.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass flex flex-col rounded-3xl p-6"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${m.color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold">{m.name}</h3>
              <p className="mt-1 text-sm text-muted">{m.desc}</p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-accent">{t.methods.steps}</p>
              <ol className="mt-1.5 space-y-1">
                {m.steps.map((s, j) => (
                  <li key={j} className="flex gap-2 text-sm text-foreground/85">
                    <span className="font-semibold text-brand">{j + 1}.</span>
                    {s}
                  </li>
                ))}
              </ol>

              <p className="mt-4 text-xs text-muted">
                <span className="font-semibold text-foreground/70">{t.methods.goodFor}:</span> {m.goodFor}
              </p>

              {m.goTo && (
                <button
                  onClick={() => onNavigate(m.goTo!)}
                  className="mt-4 self-start rounded-xl bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
                >
                  {t.methods.tryIt} →
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
